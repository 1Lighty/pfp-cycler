const { getModule, React } = require('powercord/webpack');
const { Plugin } = require('powercord/entities');
const { join } = require('path');
const { existsSync, mkdirSync, readdirSync, readFileSync, statSync } = require('fs');

const PFP_FOLDER = join(__dirname, 'icons');

const AccountSettingsSetters = getModule(['saveAccountChanges', 'setPendingAvatar'], false);
const IMAGE_RE = /\.{0,1}(png|jpe?g|gif)$/i;

const Settings = require('./Settings.jsx');

module.exports = class ProfilePictureCycler extends Plugin {
  constructor(...whateverpropspowercordpluginsgetidontfuckingcare) {
    super(...whateverpropspowercordpluginsgetidontfuckingcare);
    this.cyclerInterval = this.cyclerInterval.bind(this);
  }
  startPlugin() {
    if (!existsSync(PFP_FOLDER)) {
      this.log('Creating folder for profile pictures');
      mkdirSync(PFP_FOLDER);
    }
    const hours = this.settings.get('interval', 1);
    this.log(`Setting interval to ${hours} hour(s)`);
    this.setInterval(hours);
    powercord.api.settings.registerSettings('pfp-cycler', {
      category: this.entityID,
      label: 'Profile Picture Cycler',
      render: props => <Settings
        {...props}
        updateSetting={(key, val) => {
          props.updateSetting(key, val);
          clearInterval(this.interval);
          this.setInterval(val);
          this.log(`Setting interval to ${val} hour(s)`);
        }}
        folderPath={PFP_FOLDER}
      />
    });
  }
  pluginWillUnload() {
    clearInterval(this.interval);
  }
  setInterval(hours) {
    this.interval = setInterval(this.cyclerInterval, hours * 60 * 60 * 1000);
  }
  cyclerInterval() {
    const last = this.settings.get('last', 0);
    const current = this.settings.get('current', '');
    // if last submission was less than an hour ago, return
    if (Date.now() - last < 60 * 60 * 1000) return;
    let files = readdirSync(PFP_FOLDER);
    // filter out folders and non images
    files = files.filter(f => statSync(join(PFP_FOLDER, f)).isFile() && IMAGE_RE.test(f));
    this.log(`Found ${files.length} files`);
    if (!files.length) return;
    // get random file that is not current
    const random = files.filter(f => f !== current)[Math.floor(Math.random() * (files.length - 1))];
    if (!random) {
      this.error('No file found');
      return;
    }
    this.log(`Setting new profile picture to ${random}`);
    this.settings.set('current', random);
    this.settings.set('last', Date.now());
    // convert file to base64
    const base64 = readFileSync(join(PFP_FOLDER, random)).toString('base64');
    // convert to data url
    const dataUrl = `data:image/png;base64,${base64}`;
    AccountSettingsSetters.saveAccountChanges({ avatar: dataUrl }).catch(err => {
      this.error(err);
      // failed, set last to now + 1 hour
      this.settings.set('last', Date.now() + 60 * 60 * 1000);
    });
  }
};
