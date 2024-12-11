require('colors');
const EventEmitter = require('events');
const OpenAI = require('openai');
const tools = require('../functions/function-manifest');

// Import all functions included in function manifest
// Note: the function name and file name must be the same
const availableFunctions = {};
tools.forEach((tool) => {
  let functionName = tool.function.name;
  availableFunctions[functionName] = require(`../functions/${functionName}`);
});

class GptService extends EventEmitter {
  constructor(apiKey) {
    super();

    this.openai = new OpenAI({ apiKey });
    this.userContext = [
      {
        'role': 'system',
        'content': 'You are a customer service representative, you will make calls to customers to inquire and collect information about their financial assistance.'
      },
    ];
    this.partialResponseIndex = 0;
  }

  // Add the callSid to the chat context in case
  // ChatGPT decides to transfer the call.
  setCallSid(callSid) {
    this.userContext.push({'role': 'system', 'content': `callSid: ${callSid}`});
    this.userContext.push({'role': 'system', 'content': 'call getAgentName function and save agentName'});

    return this;
  }

  validateFunctionArgs(args) {
    try {
      return JSON.parse(args);
    } catch (error) {
      console.log('Warning: Double function arguments returned by OpenAI:', args);
      // Seeing an error where sometimes we have two sets of args
      if (args.indexOf('{') != args.lastIndexOf('{')) {
        return JSON.parse(args.substring(args.indexOf(''), args.indexOf('}') + 1));
      }
    }
  }

  updateUserContext(name, role, text) {
    if (name !== 'user') {
      this.userContext.push({'role': role, 'name': name, 'content': text});
    } else {
      this.userContext.push({'role': role, 'content': text});
    }
  }

  async completion(text, interactionCount, role = 'user', name = 'user') {
    this.updateUserContext(name, role, text);

    // Step 1: Send user transcription to Chat GPT
    const stream = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: this.userContext,
      tools: tools,
      stream: true,
    });

    let completeResponse = '';
    let partialResponse = '';
    let functionName = '';
    let functionArgs = '';
    let finishReason = '';

    function collectToolInformation(deltas) {
      let name = deltas.tool_calls[0]?.function?.name || '';
      if (name?.length) {
        functionName = name;
      }
      let args = deltas.tool_calls[0]?.function?.arguments || '';
      if (args?.length) {
        // args are streamed as JSON string so we need to concatenate all chunks
        functionArgs += args;
      }
    }

    for await (const chunk of stream) {
      let content = chunk.choices[0]?.delta?.content || '';
      let deltas = chunk.choices[0].delta;
      finishReason = chunk.choices[0].finish_reason;

      // Step 2: check if GPT wanted to call a function
      if (deltas.tool_calls) {
        // Step 3: Collect the tokens containing function data
        collectToolInformation(deltas);
      }

      // need to call function on behalf of Chat GPT with the arguments it parsed from the conversation
      if (finishReason === 'tool_calls') {
        // parse JSON string of args into JSON object

        const functionToCall = availableFunctions[functionName];
        const validatedArgs = this.validateFunctionArgs(functionArgs);

        // Say a pre-configured message from the function manifest
        // before running the function.
        const toolData = tools.find(tool => tool.function.name === functionName);
        const say = toolData.function.say ?? '';
        let functionResponse = null;
        if (toolData.function.sync) {
          functionResponse = await functionToCall(validatedArgs);

          this.emit('gptreply', {
            partialResponseIndex: null,
            partialResponse: say,
            args: functionResponse,
          }, interactionCount);

        } else {
          this.emit('gptreply', {
            partialResponseIndex: null,
            partialResponse: say,
          }, interactionCount);

          functionResponse = await functionToCall(validatedArgs);
          await this.completion(functionResponse, interactionCount, 'function', functionName);
        }


        // Step 4: send the info on the function call and function response to GPT
        this.updateUserContext(functionName, 'function', functionResponse);

        // call the completion function again but pass in the function response to have OpenAI generate a new assistant response
      } else {
        // We use completeResponse for userContext
        completeResponse += content;
        // We use partialResponse to provide a chunk for TTS
        partialResponse += content;
        // Emit last partial response and add complete response to userContext
        if (content.trim().slice(-1) === '•' || finishReason === 'stop') {
          const gptReply = {
            partialResponseIndex: this.partialResponseIndex,
            partialResponse
          };

          this.emit('gptreply', gptReply, interactionCount);
          this.partialResponseIndex++;
          partialResponse = '';
        }
      }
    }
    this.userContext.push({'role': 'assistant', 'content': completeResponse});
    console.log(`GPT -> user context length: ${this.userContext.length}`.green);
  }
}

module.exports = {GptService};
