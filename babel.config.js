//babel.config.js
module.exports = (api) => {
    const isTest = api.env('test');
    const isLoader = api.caller((caller) => {
        return !!(caller && (caller.name == 'babel-loader'));
    });

    if(isLoader){
        return {
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-transform-runtime']
        }
    } else {
        return {
            presets: [
                [
                    '@babel/preset-env',
                    {
                        'targets': {
                            'node': 'current'
                        }
                    }
                ]
            ]
        };
    }
}