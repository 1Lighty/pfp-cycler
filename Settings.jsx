const { React, getModuleByDisplayName } = require('powercord/webpack');
const { SliderInput } = require('powercord/components/settings');
const { AsyncComponent } = require('powercord/components');
const FormItem = AsyncComponent.from(getModuleByDisplayName('FormItem'));
const FormText = AsyncComponent.from(getModuleByDisplayName('FormText'));

module.exports = class Settings extends React.PureComponent {
  render() {
    const { getSetting, updateSetting } = this.props;

    return (
      <SliderInput title='Profile picture interval' value={getSetting('interval')} onValueChange={val => {
        const ol = getSetting('interval', 1);
        if (ol === val) return;
        updateSetting('interval', val);
      }} min={1} max={12} markers={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]} stickToMarkers={true} onMarkerRender={e => `${e}h`}/>
    );
  }
};
