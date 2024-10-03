const renderPiece = (piece) => {
  const pieceSymbols = {
    'k': '♔', 'q': '♕', 'r': '♖', 'b': '♗', 'n': '♘', 'p': '♙',
    'K': '♚', 'Q': '♛', 'R': '♜', 'B': '♝', 'N': '♞', 'P': '♟'
  };
  return pieceSymbols[piece] || '';
};

const MoveDisplay = ({ move, index, currentIndex, onMoveClick }) => (

  <span 
    className={`move ${index % 2 === 0 ? 'white-move' : 'black-move'} ${index === currentIndex ? 'current-move' : ''}`}
    onClick={onMoveClick}
  >
    {renderPiece(move.piece)}
    {move.san}
  </span>
);

export default MoveDisplay;