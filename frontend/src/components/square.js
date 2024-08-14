import React from "react"
import './square.css'

function Square({ piece, isLight, isSelected, onClick }) {
    return (
        <div
            className={`square ${isLight ? 'light' : 'dark'} ${isSelected ? 'selected' : ''}`}
            onClick={onClick}>
            {piece}
        </div>
    )
}

export default Square