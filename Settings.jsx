const { React, getModule, getModuleByDisplayName } = require('powercord/webpack');
const { SliderInput } = require('powercord/components/settings');
const { AsyncComponent, Button } = require('powercord/components');
const { inject, uninject } = require('powercord/injector');
const { existsSync, writeFileSync } = require('fs');
const { join } = require('path');
const FormItem = AsyncComponent.from(getModuleByDisplayName('FormItem'));
const { shell } = require('electron');

module.exports = class Settings extends React.PureComponent {
  componentWillUnmount() {
    try {
      uninject('pfp-cycler-set-pfp');
    } catch {}
  }
  render() {
    const { getSetting, updateSetting } = this.props;

    return (
      <div>
        <SliderInput title='Profile picture interval' initialValue={getSetting('interval', 1)} onValueChange={val => {
          const ol = getSetting('interval', 1);
          if (ol === val) return;
          updateSetting('interval', val);
        }} min={1} max={12} markers={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]} stickToMarkers={true} onMarkerRender={e => `${e}h`}/>
        <FormItem>
          <Button onClick={() => {
            const OpenSelectImageModal = getModule(['handleOpenSelectImageModal'], false);
            const OpenProfilePreviewModal = getModule(['maybeOpenProfilePreviewModal'], false);
            if (!OpenSelectImageModal || !OpenProfilePreviewModal) return;
            uninject('pfp-cycler-set-pfp');
            inject('pfp-cycler-set-pfp', OpenProfilePreviewModal, 'maybeOpenProfilePreviewModal', args => {
              if (args[3] === 'pfp-cycler') {
                uninject('pfp-cycler-set-pfp');
                try {
                  let [dataUrl, { name: filename }] = args;
                  const { folderPath: PFP_FOLDER } = this.props;
                  // check if filename already exists in pfp folder, if it does, randomize the filename
                  if (existsSync(join(PFP_FOLDER, filename))) filename = `${Math.random().toString(36).substring(2, 15)}${filename}`;
                  // convert data url to buffer
                  const buffer = Buffer.from(dataUrl.replace(/^data:.+\/(.+);base64,(.*)$/, '$2'), 'base64');
                  // write buffer to disk
                  writeFileSync(join(PFP_FOLDER, filename), buffer);
                } catch (err) {
                  console.error(`[pfp-cycler] ${err.stack}`);
                }
                return false;
              }
              return args;
            }, true);
            OpenSelectImageModal.handleOpenSelectImageModal(0, 'pfp-cycler');
          }} >Add new profile picture</Button>
        </FormItem>
        <FormItem>
          <Button onClick={() => shell.showItemInFolder(this.props.folderPath)}>Open icons folder</Button>
        </FormItem>
      </div>);
  }
};
