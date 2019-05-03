var ghPages = require('gh-pages');

var options = {
  message: 'Deploy using deploy-gh-pages.js',
  src: [
    '**/*',
    '.nojekyll',
    '!deploy-gh-pages.js',
    '!package.json',
    '!package-lock.json'
  ]
};

console.log('Deploying to the origin/gh-pages branch of this repository...');
ghPages.publish('.', options, function (err) {
  if (err) {
    console.error('Deploy failed.');
    console.error(err);
  } else {
    console.log('Deploy succesful!');
  }
});
