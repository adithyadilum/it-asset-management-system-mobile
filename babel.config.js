module.exports = function (api) {
    api.cache(true);
    return {
        presets: [
            ["babel-preset-expo", { jsxImportSource: "nativewind" }]
        ],
        plugins: [
            "react-native-reanimated/plugin", // Often required by Expo Router, good to have
        ],
    };
};