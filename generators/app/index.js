const Generator = require('yeoman-generator');
const depJ = require('./dep');
const fs = require('fs');
const { makeItFabolus } = require('./starrify');
const chalk = require('chalk');

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);
  }

  prompting() {
    this._npmInit();
  }

  
  writing() {
    const data = fs.readFileSync(this.destinationPath('./package.json'), 'utf8');
    const dataJSON = JSON.parse(data);
    Object.assign(dataJSON, depJ);
    fs.writeFileSync(this.destinationPath('./package.json'), JSON.stringify(dataJSON, null, ' '));
    this._npmInstall();
    this._gitInit();
    this._fileCopy();
  }

  end() {
    this._finalOutput();
  }

  _fileCopy() {
    console.log(makeItFabolus('copying/creating files', 1));
    fs.mkdirSync(this.destinationPath('./__tests__'));
    this.fs.copyTpl(this.templatePath('gulpfile.js'), this.destinationPath('./gulpfile.js'));
    this.fs.copyTpl(this.templatePath('gulppaths.js'), this.destinationPath('./gulppaths.js'));
    this.fs.copyTpl(this.templatePath('.babelrc'), this.destinationPath('./.babelrc'));
    this.fs.copyTpl(this.templatePath('src'), this.destinationPath('./src'));
  }

  _npmInit() {
    console.log(makeItFabolus('initialiazing npm', 1));
    this.spawnCommandSync('npm', ['init']);
  }

  _npmInstall() {
    console.log(makeItFabolus('installing packages', 1));
    this.spawnCommandSync('npm', ['install']);
  }

  _gitInit() {
    console.log(makeItFabolus('initializing git', 1));
    this.spawnCommandSync('git', ['init']);
  }

  _finalOutput() {
    console.log(makeItFabolus('use "npm start" command'));
  }
};
