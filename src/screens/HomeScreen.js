import {
  View,
  Text,
  SafeAreaView,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import React, {useEffect, useRef, useState} from 'react';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import Features from '../components/Features';
import {dummyMessages} from '../constants';
import Voice from '@react-native-community/voice';
import {apiCall} from '../api/openAi';
import Tts from 'react-native-tts';

const HomeScreen = () => {
  const [messages, setMessages] = useState([]);
  const [recording, setRecording] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [results, setResults] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef();

  //voice handler events
  useEffect(() => {
    Voice.onSpeechStart = speechStartHandler;
    Voice.onSpeechEnd = speechEndHandler;
    Voice.onSpeechResults = speechResultsHandler;
    Voice.onSpeechError = speechErrorHandler;

    //Text To Speech Events
    Tts.addEventListener('tts-start', event => console.log('start', event));
    Tts.addEventListener('tts-progress', event =>
      console.log('progress', event),
    );
    Tts.addEventListener('tts-finish', event => {
      console.log('finish', event);
      setSpeaking(false);
    });
    Tts.addEventListener('tts-cancel', event => console.log('cancel', event));

    return () => Voice.destroy().then(Voice.removeAllListeners());
  }, []);

  const speechStartHandler = e => {
    console.log('Speech Start Handler.');
  };

  const speechEndHandler = e => {
    setRecording(false);
    console.log('Speech End Handler.');
  };

  const speechResultsHandler = e => {
    console.log('Voice Events.', e);
    const text = e.value[0];
    setResults(text);
  };

  const speechErrorHandler = e => {
    console.log('Error Handler', e);
  };

  const recordingStart = async () => {
    setRecording(true);
    Tts.stop();
    try {
      await Voice.start('en-GB');
    } catch (error) {
      console.log('Error', error);
    }
  };

  const recordingStop = async () => {
    try {
      await Voice.stop();
      setRecording(false);

      //fetching Response
      fetchResponse();
    } catch (error) {
      console.log('Error', error);
    }
  };

  const fetchResponse = () => {
    if (results.trim().length > 0) {
      let newMessages = [...messages];
      newMessages.push({role: 'user', content: results.trim()});
      setMessages([...newMessages]);
      updateScrollView();
      setLoading(true);

      apiCall(results.trim(), newMessages).then(res => {
        console.log('Got Api Data', res);
        setLoading(false);
        if (res.success) {
          setMessages([...res.data]);
          updateScrollView();
          setResults('');
          startTextToSpeech(res.data[res.data.length - 1]);
        } else {
          Alert.alert('Error', res.msg);
        }
      });
    }
  };

  const startTextToSpeech = message => {
    if (!message.content.includes('https')) {
      if (Platform.OS === 'ios') {
        setSpeaking(true);
        Tts.speak(message.content, {
          iosVoiceId: 'com.apple.ttsbundle.Moira-compact',
          rate: 0.5,
        });
      } else {
        Tts.speak(message.content, {
          androidParams: {
            KEY_PARAM_PAN: -1,
            KEY_PARAM_VOLUME: 0.5,
            KEY_PARAM_STREAM: 'STREAM_MUSIC',
          },
        });
      }
    }
  };

  const updateScrollView = () => {
    setTimeout(() => {
      scrollViewRef?.current?.scrollToEnd({animated: true});
    }, 200);
  };

  const clearMessages = () => {
    setMessages([]);
    Tts.stop();
  };

  const stopSpeaking = () => {
    Tts.stop();
    setSpeaking(false);
  };
  return (
    <View className="flex-1 bg-white">
      <SafeAreaView className="flex-1 flex mx-5">
        <View className="flex-row justify-center">
          <Image
            source={require('../../assets/images/bot.png')}
            style={{width: hp(15), height: hp(15)}}
          />
        </View>

        {messages.length > 0 ? (
          <View className="space-y-2 flex-1">
            <Text
              style={{fontSize: wp(5)}}
              className="text-gray-700 font-semibold ml-1">
              Assistant
            </Text>
            <View
              style={{height: hp(58)}}
              className="bg-neutral-200 rounded-3xl p-4">
              <ScrollView
                ref={scrollViewRef}
                className="space-y-4"
                bounces={false}
                showsVerticalScrollIndicator={false}>
                {messages.map((message, index) => {
                  if (message.role == 'assistant') {
                    if (message.content.includes('https')) {
                      //it's an AI image.
                      return (
                        <View key={index} className="flex-row justify-start">
                          <View className="p-2 flex rounded-2xl bg-emerald-100 rounded-tl-none">
                            <Image
                              style={{height: wp(60), width: wp(60)}}
                              resizeMode="contain"
                              className="rounded-2xl"
                              source={{uri: message.content}}
                            />
                          </View>
                        </View>
                      );
                    } else {
                      //text response
                      return (
                        <View
                          key={index}
                          style={{width: wp(70)}}
                          className="bg-emerald-100 rounded-xl p-2 rounded-tl-none">
                          <Text>{message.content}</Text>
                        </View>
                      );
                    }
                  } else {
                    //user input
                    return (
                      <View key={index} className="flex-row justify-end">
                        <View
                          style={{width: wp(70)}}
                          className="bg-white rounded-xl p-2 rounded-tr-none">
                          <Text>{message.content}</Text>
                        </View>
                      </View>
                    );
                  }
                })}
              </ScrollView>
            </View>
          </View>
        ) : (
          <Features />
        )}

        <View className="flex justify-center items-center">
          {loading ? (
            <Image
              style={{width: hp(10), height: hp(10)}}
              source={require('../../assets/images/loading.gif')}
            />
          ) : recording ? (
            <TouchableOpacity onPress={recordingStop}>
              <Image
                source={require('../../assets/images/voiceLoading.gif')}
                className="rounded-full"
                style={{width: hp(10), height: hp(10)}}
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={recordingStart}>
              <Image
                source={require('../../assets/images/recordingIcon.png')}
                className="rounded-full"
                style={{width: hp(10), height: hp(10)}}
              />
            </TouchableOpacity>
          )}

          {speaking && (
            <TouchableOpacity
              onPress={() => {
                stopSpeaking();
              }}
              className="bg-red-400 rounded-3xl p-2 absolute left-10">
              <Text className="text-white font-semibold">Stop</Text>
            </TouchableOpacity>
          )}

          {messages.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                clearMessages();
              }}
              className="bg-neutral-400 rounded-3xl p-2 absolute right-10">
              <Text className="text-white font-semibold">Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};

export default HomeScreen;
