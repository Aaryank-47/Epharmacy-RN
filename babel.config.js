const nativewind = require('nativewind/babel');

module.exports = function (api) {
  api.cache(true);
  const nativewindConfig = nativewind();
  const filteredPlugins = (nativewindConfig.plugins || []).filter((plugin) => {
    if (typeof plugin === 'string') {
      return plugin !== 'react-native-worklets/plugin';
    }

    if (Array.isArray(plugin) && plugin[0] === 'react-native-worklets/plugin') {
      return false;
    }

    return true;
  });

  return {
    presets: ['module:@react-native/babel-preset'],
    plugins: [...filteredPlugins, 'react-native-reanimated/plugin'],
  };
};
