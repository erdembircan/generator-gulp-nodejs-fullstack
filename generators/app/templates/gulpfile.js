const gulp = require('gulp');
const folderDelete = require('folder-delete');
const runSequence = require('run-sequence');
const plugins = require('gulp-load-plugins')();
const minimist = require('minimist');
const browserSync = require('browser-sync');
const through = require('through2');
const { assign } = require('lodash');
const watchify = require('watchify');
const browserify = require('browserify');
const hbsfy = require('hbsfy');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const mergeStream = require('merge-stream');

const serverSettings = require('./src/server/settings');

const args = process.argv.slice(3);

const parsedArgs = minimist(process.argv, {
  default: {
    'server-port': serverSettings['server-port'],
  },
});

const paths = require('./gulppaths');

gulp.task('browser-sync', () => {
  browserSync.init({
    proxy: `localhost:${parsedArgs['server-port']}`,
    port: serverSettings['sync-port'],
  });
});

gulp.task('browserSync:reload', () => {
  browserSync.reload();
});

gulp.task('clean', () => {
  folderDelete('build', { debugLog: true });
});

gulp.task('client:css', () => {
  gulp
    .src(paths.clientCssSrc)
    .pipe(plugins.sass.sync().on('error', plugins.sass.logError))
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.sass({ outputStyle: 'compressed' }))
    .pipe(plugins.autoprefixer({ browsers: ['last 2 versions'] }))
    .pipe(plugins.sourcemaps.write('./'))
    .pipe(gulp.dest(paths.clientCssDest))
    .pipe(browserSync.stream());
});

function createBundle(src) {
  if (!src.push) {
    src = [src];
  }

  const customOpts = {
    entries: src,
    debug: true,
  };

  const opts = assign({}, watchify.args, customOpts);

  const b = watchify(browserify(opts));
  b.transform('babelify', {
    presets: ['env'],
  });

  b.transform(hbsfy);

  b.on('log', plugins.util.log);
  return b;
}

function bundle(b, outputPath) {
  const splitPath = outputPath.split('/');
  const outputFile = splitPath[splitPath.length - 1];

  return b
    .bundle()
    .on('error', plugins.util.log.bind(plugins.util, 'Browserift Error'))
    .pipe(source(outputFile))
    .pipe(buffer())
    .pipe(plugins.sourcemaps.init({ loadMaps: true }))
    .pipe(plugins.sourcemaps.write('./'))
    .pipe(gulp.dest(paths.clientJsDest));
}

/**
 * add your bundles with destination as key and createBundle function
 * with an arguement of to be bundled js files as values
 */
const jsBundles = {
  'build/client/js/index_bundle.js': createBundle(['./src/client/js/index.js']),
};

gulp.task('client:js', () => {
  mergeStream(Object.keys(jsBundles).map(key => bundle(jsBundles[key], key)));
});

gulp.task('server:js', () =>
  gulp
    .src(paths.serverJsSrc)
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.babel())
    .on('error', plugins.util.log.bind(plugins.util))
    .pipe(plugins.sourcemaps.write('.'))
    .pipe(gulp.dest(paths.serverJsDest)));

gulp.task('server:templates', () => {
  gulp
    .src(paths.serverTemplatesSrc)
    .pipe(plugins.handlebars())
    .on('error', plugins.util.log.bind(plugins.util))
    .pipe(through.obj((file, enc, callback) => {
      file.defineModuleOptions.require = { Handlebars: 'handlebars/runtime' };
      callback(null, file);
    }))
    .pipe(plugins.defineModule('commonjs'))
    .pipe(plugins.rename((path) => {
      path.extname = '.js';
    }))
    .pipe(gulp.dest(paths.serverTemplatesDest));
});

gulp.task('develop-server-restart', () => {
  plugins.developServer.restart((err) => {
    browserSync.reload();
  });
});

gulp.task('server:develop', () => {
  plugins.developServer.listen({
    path: './index.js',
    cwd: './build/server',
    args,
  });

  gulp.watch(['build/server/**/*.js'], ['develop-server-restart']);
});

gulp.task('watch', () => {
  gulp.watch(['src/server/**/*.js'], ['server:js']);
  gulp.watch(['src/server/templates/**/*.hbs'], ['server:templates']);
  gulp.watch(['src/client/sass/**/*.sass'], ['client:css']);
  gulp.watch(['build/client/js/**/*.js'], ['browserSync:reload']);

  Object.keys(jsBundles).map((key) => {
    const b = jsBundles[key];
    b.on('update', () => bundle(b, key));
  });
});

gulp.task('serve', (done) => {
  runSequence(
    'clean',
    ['client:css', 'client:js', 'server:templates', 'server:js'],
    ['server:develop', 'watch', 'browser-sync'],
    done
  );
});
