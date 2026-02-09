interface ChallengeButtonProps {
  energyCost: number;
  disabled: boolean;
  onClick: () => void;
}

export default function ChallengeButton({ energyCost, disabled, onClick }: ChallengeButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        backgroundColor: disabled ? '#555' : '#e94560',
        color: '#fff',
        border: 'none',
        padding: '6px 16px',
        borderRadius: '4px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '0.85em',
        fontWeight: 'bold',
        whiteSpace: 'nowrap',
      }}
    >
      Fight ({energyCost} AE)
    </button>
  );
}
