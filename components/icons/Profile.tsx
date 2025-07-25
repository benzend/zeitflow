interface IconProps {
  className?: string;
  size?: number;
}

export const ProfileIcon: React.FC<IconProps> = ({
  className = '',
  size = 38,
}) => (
  <svg width={size} height={size} viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <mask id="mask0_219_8" style={{maskType: 'alpha'}} maskUnits="userSpaceOnUse" x="0" y="0" width="38" height="38">
    <circle cx="19" cy="19" r="19" fill="#75A625"/>
    </mask>
    <g mask="url(#mask0_219_8)">
    <circle cx="18.525" cy="18.525" r="21.375" fill="#87A96B"/>
    <circle cx="19" cy="14.25" r="5.7" fill="#A3E635"/>
    <circle cx="19" cy="36.1" r="12.35" fill="#A3E635"/>
    </g>
  </svg>
  );
