import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import EventHooksPlugin from 'event-hooks-webpack-plugin';
import { CallbackTask } from 'event-hooks-webpack-plugin/lib/tasks';
import TerserPlugin from 'terser-webpack-plugin';
 
const hashNameExclude = ['ScoreBar'];

const config = {
    entry: {
        'ScoreBar': './customElement/ScoreBar.ts'
    },
    output: {
        filename: (chunkData) => {
            if(process.env.NODE_ENV === 'production' 
               && !hashNameExclude.includes(chunkData.chunk.name)
            ){
                return '[chunkhash].js';
            }else{
                return '[name].js';
            }
        }
    },
    externals: [
        {
            'window': 'window'
        }
    ],
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /(node_modules|bower_components)/,
                use: [
                    {
                        loader: 'ts-loader'
                    }
                ]
            },
            {
                test: /\.m?js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader'
                }
            },
            {
                test: /\.scss$/,
                use: [
                    // applied from right to left
                    {
                        loader: 'style-loader'
                    },
                    {
                        loader: 'css-loader',
                        options: {
                            modules: true
                        }
                    },
                    {
                        loader: 'sass-loader'
                    }
                ]
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        plugins: [new TsconfigPathsPlugin()]
    },
    plugins: [
        new EventHooksPlugin({
            emit: new CallbackTask((compilation, callback) => {
                // https://bugzilla.mozilla.org/show_bug.cgi?id=1408996
                if(process.env.VENDOR == 'firefox' && compilation.assets['ScoreBar.js']){
                    const source = `
                        const script = document.createElement('script');
                        script.innerHTML = ${stringify(compilation.assets['ScoreBar.js'].source())};
                        document.body.appendChild(script);
                    `;

                    compilation.assets['ScoreBar.js'].source = () => {
                        return source;
                    }
                }

                callback();
            })
        })
    ],
    optimization: {
        minimizer: [
            new TerserPlugin({
                extractComments: true,
                cache: true,
                parallel: true,
                terserOptions: {
                  // https://github.com/webpack-contrib/terser-webpack-plugin#terseroptions
                   extractComments: 'all',
                   compress: {
                       drop_console: true,
                   }
                }
            })
        ],
        splitChunks: {
            chunks (chunk) {
                return chunk.name !== 'ScoreBar';
            },
            automaticNameDelimiter: '-' // use '~' => load error.
        }
    }
};

export default config;

function stringify(obj) {
    if (obj instanceof Date) {
      return 'new Date(' + stringify(obj.toISOString()) + ')';
    }
    if (obj === undefined) {
      return 'undefined';
    }
    return JSON.stringify(obj)
               .replace(/\u2028/g, '\\u2028')
               .replace(/\u2029/g, '\\u2029')
               .replace(/</g, '\\u003C')
               .replace(/>/g, '\\u003E')
               .replace(/\//g, '\\u002F');
}