module.exports = function(config) {
  const configuration = {
    basePath: '',
    frameworks: ['mocha', 'chai'],
    files: [
      'build/resonance-audio.js',
      'test/test-*.js',
    ],
    reporters: ['mocha'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: ['Chrome'],
    customLaunchers: {
      Chrome_travis_ci: {
        base: 'Chrome',
        flags: ['--no-sandbox']
      }
    },
    singleRun: true,
    concurrency: Infinity
  };

  // For Travis CI.
  if (process.env.TRAVIS) {
    configuration.browsers = ['Chrome_travis_ci'];
  }

  config.set(configuration);
};
