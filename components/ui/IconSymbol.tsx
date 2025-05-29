// This file is a fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight } from 'expo-symbols';
import React from 'react';
import { OpaqueColorValue, StyleProp, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

// IconMap type to specify which icon library to use
type IconMap = {
  name: string;
  library: 'material' | 'ionicons';
};

// Add your SFSymbol to icon mappings here.
const MAPPING: Record<string, IconMap> = {
  // See MaterialIcons here: https://icons.expo.fyi
  // See SF Symbols in the SF Symbols app on Mac.
  'house.fill': { name: 'home', library: 'material' },
  'paperplane.fill': { name: 'send', library: 'material' },
  'chevron.left.forwardslash.chevron.right': { name: 'code', library: 'material' },
  'chevron.right': { name: 'chevron-right', library: 'material' },
  'plus': { name: 'add-box', library: 'material' },
  'person': { name: 'person', library: 'material' },
  'trophy.fill': { name: 'emoji-events', library: 'material' },
  'bicycle-sharp': { name: 'bicycle-sharp', library: 'ionicons' },
};

export type IconSymbolName = keyof typeof MAPPING;

/**
 * An icon component that uses native SFSymbols on iOS, and MaterialIcons or Ionicons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 *
 * Icon `name`s are based on SFSymbols and require manual mapping to MaterialIcons or Ionicons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}) {
  const iconMap = MAPPING[name];

  if (!iconMap) {
    console.warn(`Icon mapping not found for: ${name}`);
    return null;
  }

  if (iconMap.library === 'ionicons') {
    return <Ionicons color={color} size={size} name={iconMap.name as any} style={style as any} />;
  }

  return <MaterialIcons color={color} size={size} name={iconMap.name as any} style={style as any} />;
}
