import Svg, { Path } from "react-native-svg";

// Icônes vectorielles inline (react-native-svg) — rendues en vrai <svg> sur web,
// donc pas de carrés "tofu" liés au chargement d'une police d'icônes.
type IconProps = { color: string; size?: number };

export function HomeIcon({ color, size = 26 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill={color} />
    </Svg>
  );
}

export function CrownIcon({ color, size = 26 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 16L3 6l5 4 4-7 4 7 5-4-2 10H5zm0 3h14v2H5v-2z" fill={color} />
    </Svg>
  );
}

export function BookmarkIcon({ color, size = 26 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M17 3H7a2 2 0 0 0-2 2v16l7-3 7 3V5a2 2 0 0 0-2-2z" fill={color} />
    </Svg>
  );
}

export function PersonIcon({ color, size = 26 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
        fill={color}
      />
    </Svg>
  );
}
