import axios from 'axios';
import {apiKey} from '../constants/index';

const client = axios.create({
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + apiKey,
  },
});

const chatGptEndpoint = 'https://api.openai.com/v1/chat/completions';
const dalleEndpoint = 'https://api.openai.com/v1/images/generations';

export const apiCall = async (prompt, messages) => {
  try {
    const res = await client.post(chatGptEndpoint, {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: `Does this message want to generate an AI picture, image, art or anything similar? ${prompt} . Simply answer with a yes or no.`,
        },
      ],
    });

    console.log('data: ', res.data?.choices[0]?.message);
    let isArt = res.data?.choices[0]?.message?.content;

    if (isArt.toLowerCase().includes('yes')) {
      console.log('dalle api call');
      return dalleApiCall(prompt, messages || []);
    } else {
      console.log('chat Gpt Api Call');
      return chatGptApiCall(prompt, messages || []);
    }
  } catch (error) {
    console.log('Error', error);
    return Promise.resolve({success: false, msg: error.message});
  }
};

const chatGptApiCall = async (prompt, messages) => {
  try {
    const res = await client.post(chatGptEndpoint, {
      model: 'gpt-3.5-turbo',
      messages,
    });

    let answer = res.data?.choices[0]?.message?.content;
    messages.push({role: 'assistant', content: answer.trim()});
    return Promise.resolve({success: true, data: messages});
  } catch (error) {
    console.log('Error', error);
    return Promise.resolve({success: false, msg: error.message});
  }
};

const dalleApiCall = async () => {
  try {
    const res = await client.post(dalleEndpoint, {
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '512x512',
    });

    let url = res?.data?.data[0]?.url;
    console.log('Got the url of the image.', url);
    messages.push({role: 'assistant', content: url});
    return Promise.resolve({success: true, data: messages});
  } catch (error) {
    console.log('Error', error);
    return Promise.resolve({success: false, msg: error.message});
  }
};
