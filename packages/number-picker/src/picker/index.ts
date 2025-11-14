import PickerGroupRoot from './PickerGroup';
import PickerColumn from './PickerColumn';
import PickerItem from './PickerItem';

const PickerGroup = Object.assign(PickerGroupRoot, { Column: PickerColumn, Item: PickerItem });

export default PickerGroup;
export { PickerGroup, PickerColumn, PickerItem };
export * from './types';
export { usePickerConfig } from './context';
export { usePickerData, type PickerOption } from './PickerGroup';
