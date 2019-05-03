var ghPages = require('gh-pages');

ghPages.publish('.', function (err) {
  console.log('Deploying to the origin/gh-pages branch of this repository...');
  if (err) {
    console.error('Deploy failed.');
    console.error(err);
  } else {
    console.log('Deploy succesful!');
  }
});