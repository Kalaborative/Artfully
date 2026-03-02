export type NameEffect = 'fire-name' | null;

interface DisplayNameProps {
  name: string;
  effect?: string | null;
  className?: string;
}

export default function DisplayName({ name, effect, className = '' }: DisplayNameProps) {
  if (effect === 'fire-name') {
    return (
      <span className={`fire-name ${className}`} data-text={name}>
        {name}
      </span>
    );
  }

  return <span className={className}>{name}</span>;
}
