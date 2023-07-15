export default {
    verbose: true,
    files: ['test/*.b.js'],
    babel: false,
    compileEnhancements: false,
    typescript: {
        rewritePaths: {
            "src/": "build/"
        },
        compile: false
    }
};
