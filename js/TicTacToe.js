;

let TicTacToe = (function() {
  'use strict';

  const FIRST = 1;
  const SECOND = 2;

  // Matching cells of the playing field to the numbers of bits
  // 0 1 2
  // 3 4 5
  // 6 7 8

  // Winning combinations
  const winners = [
    // bits:  876543210
    parseInt('000000111', 2),
    parseInt('000111000', 2),
    parseInt('111000000', 2),
    parseInt('001001001', 2),
    parseInt('010010010', 2),
    parseInt('100100100', 2),
    parseInt('100010001', 2),
    parseInt('001010100', 2)
  ];

  let player;

  let fieldState,
    firstPlayerTurns,
    secondPlayerTurns;
  
  let startBtn = document.getElementById('start');
  let _gameField = document.querySelector('.game-field');
  let _output = document.querySelector('.output');
  let _overlay = document.querySelector('.overlay');
  let _firstPlayerField = document.querySelector('.first');
  let _secondPlayerField = document.querySelector('.second');
  
  let draggable = {};

  /**
   * Initializes the module.
   * @returns void
   */
  let init = function () {
    drawGameField();
  };

  /**
   * Renders the game field.
   * @returns void
   */
  function drawGameField() {
    let tbody = document.createElement('tbody');
    let fragment = document.createDocumentFragment();
    
    for (let i = 0; i < 3; i++) {
      let tr = document.createElement('tr');
      
      for (let j = 0; j < 3; j++) {
        let td = document.createElement('td');
        td.setAttribute('id', i * 3 + j);
        td.classList.add('droppable');
        tr.appendChild(td);
      }
      
      fragment.appendChild(tr);
    }
    
    tbody.appendChild(fragment);
    _gameField.appendChild(tbody);
  }
  
  /**
   * Binds the event handlers.
   * @returns void
   */
  let bindEvents = function () {
    startNewGame(startBtn);
    document.addEventListener('mousedown', startDragging);
    document.addEventListener('mousemove', trackMovement);
    document.addEventListener('mouseup', endDragging);
  };
  
  //--------------------------------------------------------------
  // Main Event Handlers
  //--------------------------------------------------------------
  
  /**
   * Initializes the game.
   * @param {Object} sourceNode
   * @returns void
   */
  var startNewGame = function (sourceNode) {
    let handler = function (e) {
      _gameField.innerHTML = '';
      drawGameField();
      _initGame();
      _showPlayer(FIRST);
      _hidePlayer(SECOND);
      _output.textContent = '';
      _overlay.style.display = 'none';
      startBtn.setAttribute("disabled", "disabled");
    };
    
    sourceNode.addEventListener('click', handler);
  };
  
  //--------------------------------------------------------------
  // Main Utilities
  //--------------------------------------------------------------
  
  /**
   * Sets the initial values.
   * @returns void
   */
  function _initGame() {
    fieldState = 0;
    firstPlayerTurns = 0;
    secondPlayerTurns = 0;
    player = FIRST;
  }

  /**
   * Analyzes the player's turn.
   * @param {Number} currentDropIndex
   * @returns void
   */
  function _analyzePlayersTurn(currentDropIndex) {
    // If the game is not completed, change the player
    if (_makeTurn(currentDropIndex) == false) {
      _switchPlayer();
    } else {
      startBtn.removeAttribute("disabled");
    }
  }

  /**
   * Makes the turn of the player.
   * @param {Number} cellInd
   * @returns {Boolean}
   */
  function _makeTurn(cellInd) {
    let endOfGame = false;

    // Mark the cell as busy
    fieldState = fieldState | (1 << cellInd);

    // Save the turn of the matching player
    if (player === FIRST) {
      firstPlayerTurns = firstPlayerTurns | (1 << cellInd);
      // Check whether the turn is not a win
      winners.forEach(function(elem) {
        if ((firstPlayerTurns & elem) === elem) {
          _output.textContent = 'The first player is winner!';
          _overlay.style.display = '';
          _hidePlayer(FIRST);
          endOfGame = true;
        }
      });
    } else {
        secondPlayerTurns = secondPlayerTurns | (1 << cellInd);
        // Check whether the turn is not a win
        winners.forEach(function(elem) {
          if ((secondPlayerTurns & elem) === elem) {
            _output.textContent = 'The second player is winner!';
            _overlay.style.display = '';
            _hidePlayer(SECOND);
            endOfGame = true;
          }
        });
    }

    // no more cells to move - draw
    if (fieldState === parseInt('111111111', 2) && !endOfGame) {
      _output.textContent = 'Draw!';
      _hidePlayer(FIRST);
      _hidePlayer(SECOND);
      endOfGame = true;
    }
    
    return endOfGame;
  }

  //--------------------------------------------------------------
  // Toggles
  //--------------------------------------------------------------
  
  /**
   * Toggles the players.
   * @returns void
   */
  function _switchPlayer() {
    if (player === FIRST) {
        player = SECOND;
        _hidePlayer(FIRST);
        _showPlayer(SECOND);
    } else {
        player = FIRST;
        _showPlayer(FIRST);
        _hidePlayer(SECOND);
    }
  }
  
  /**
   * Shows the player.
   * @returns void
   */
  function _showPlayer(player) {
    (player === FIRST) ? _firstPlayerField.style.opacity = 1 :
                         _secondPlayerField.style.opacity = 1;

    _createDragElem(player);
  }

  /**
   * Hides the player.
   * @returns void
   */
  function _hidePlayer(player) {
    (player === FIRST) ? _firstPlayerField.style.opacity = 0 :
                         _secondPlayerField.style.opacity = 0;
  }

  //--------------------------------------------------------------
  // Drag'n'Drop Event Handlers
  //--------------------------------------------------------------

  /**
   * Handles the start of drag and drop.
   * @returns void
   */
  function startDragging(e) {
    if (e.which !== 1) {
      return;
    }
    
    let elem = e.target.closest('.draggable');

    if (!elem) return;
    
    if (e.preventDefault) {
      e.preventDefault();
    }
    
    draggable.elem = elem;
    draggable.startX = e.pageX;
    draggable.startY = e.pageY;
  }

  /**
   * Tracks the movement of the draggable element.
   * @returns void or false
   */
  function trackMovement(e) {
    if (!draggable.elem) return;
    
    if (!draggable.avatar) {
      let offsetX = e.pageX - draggable.startX;
      let offsetY = e.pageY - draggable.startY;

      if (Math.abs(offsetX) < 2 && Math.abs(offsetY) < 2) {
        return;
      }

      draggable.avatar = _createAvatar(e);
      
      if (!draggable.avatar) {
        draggable = {};
        return;
      }

      let coords = _getCoords(draggable.avatar);
      
      draggable.shiftX = draggable.startX - coords.left;
      draggable.shiftY = draggable.startY - coords.top;
      
      document.body.appendChild(draggable.avatar);
      
      draggable.avatar.style.position = 'absolute';
      draggable.avatar.style.margin = 0;
      draggable.avatar.style.top = `${coords.top}px`;
      draggable.avatar.style.left = `${coords.left}px`;
      draggable.avatar.style.zIndex = 1000;
    }
    
    draggable.avatar.style.left = e.pageX - draggable.shiftX + 'px';
    draggable.avatar.style.top = e.pageY - draggable.shiftY + 'px';
    
    _onDragEnter(e);
    _onDragLeave(e);
    
    return false;
  }
  
  /**
   * Handles the end of drag and drop.
   * @returns void
   */
  function endDragging(e) {
    if (e.which !== 1) {
      return;
    }

    if (e.preventDefault) {
      e.preventDefault();
    }
    
    if (draggable.avatar) {
      _dragFinish(e);
    }
    
    draggable = {};
  }

  //--------------------------------------------------------------
  // Drag'n'Drop Utilities
  //--------------------------------------------------------------
  
  /**
   * Creates a draggable element.
   * param {Number} player
   * @returns void
   */
  function _createDragElem(player) {
    let dragElem = document.createElement('div');
    
    if (player === FIRST) {
      dragElem.classList.add('cross');
      dragElem.textContent = 'X';
      dragElem.classList.add('draggable');
      _firstPlayerField.appendChild(dragElem);
    } else {
      dragElem.classList.add('zero');
      dragElem.textContent = '0';
      dragElem.classList.add('draggable');
      _secondPlayerField.appendChild(dragElem);
    }
  }
  
  /**
   * Handles behavior when the draggable element is above the droppable element.
   * @returns void
   */
  function _onDragEnter(e) {
    let droppable = _findDroppable(e);
    
    if (droppable) {
      if (!draggable.currentDropIndex) {
        draggable.currentDropIndex = droppable.getAttribute('id');
        _showBacklight(draggable.currentDropIndex);
      }
    }
  }
  
  /**
   * Handles behavior when the draggable element leaves the droppable element.
   * @returns void
   */
  function _onDragLeave(e) {
    let droppable = _findDroppable(e);
    
    if (droppable) {
      let indexDrop = droppable.getAttribute('id');
      
      if (draggable.currentDropIndex !== indexDrop) {
        _hideBacklight(draggable.currentDropIndex);
        draggable.currentDropIndex = indexDrop;
        _showBacklight(draggable.currentDropIndex);
      }
    } else if (draggable.currentDropIndex) {
      _hideBacklight(draggable.currentDropIndex);
      delete draggable.currentDropIndex;
    } 
  }
  
  /**
   * Shows backlight of the droppable element.
   * param {String} id
   * @returns void
   */
  function _showBacklight(id) {
    document.getElementById(id).style.background = '#d2cae3';
  }
  
  /**
   * Hides backlight of the droppable element.
   * param {String} id
   * @returns void
   */
  function _hideBacklight(id) {
    document.getElementById(id).style.background = '';
  }

  /**
   * Creates the avatar of the draggable element.
   * @returns {Object} avatar
   */
  function _createAvatar(e) {
    let avatar = draggable.elem;
    
    let oldState = {
      parent: avatar.parentNode,
      position: avatar.position || '',
      left: avatar.left || '',
      top: avatar.top || '',
      margin: avatar.margin || '',
      zIndex: avatar.zIndex || ''
    };

    // Cancels the movement of the avatar
    avatar.rollback = function () {
      avatar.style.position = oldState.position;
      avatar.style.left = oldState.left;
      avatar.style.top = oldState.top;
      avatar.style.margin = oldState.margin;
      avatar.style.zIndex = oldState.zIndex;
      oldState.parent.appendChild(avatar);
    };

    return avatar;
  }
  
  /**
   * Handles the completion of Drag'n'Drop.
   * @returns void
   */
  function _dragFinish(e) {
    let droppable = _findDroppable(e);

    if (droppable) {
      _onDragEnd(draggable, droppable);
      _analyzePlayersTurn(+draggable.currentDropIndex);
    } else {
      _onDragCancel(draggable);
    }
  }
  
  /**
   * Handles the successful completion of Drag'n'Drop.
   * @returns void
   */
  function _onDragEnd(draggable, droppable) {
    draggable.avatar.style.top = '8px';
    draggable.avatar.style.left = '8px';
    draggable.avatar.style.cursor = 'default';
    draggable.avatar.classList.remove('draggable');
    droppable.appendChild(draggable.avatar);
    
    droppable.classList.remove('droppable');
    droppable.classList.add('undroppable');
    _hideBacklight(draggable.currentDropIndex);
  }
  
  /**
   * Returns the draggable element to the previous position.
   * @returns void
   */
  function _onDragCancel(draggable) {
    draggable.avatar.rollback();
  }
  
  /**
   * Finds the droppable element.
   * @returns {Object} or null
   */
  function _findDroppable(e) {
    draggable.avatar.hidden = true;
    let elem = document.elementFromPoint(e.clientX, e.clientY);
    draggable.avatar.hidden = false;
    
    if (elem === null) {
      // If the mouse cursor is outside the screen
      return null;
    }
    
    return elem.closest('.droppable');
  }
  
  /**
   * Gets the coordinates of the draggable element.
   * @returns {Object}
   */ 
  function _getCoords(elem) {
    let box = elem.getBoundingClientRect();

    return {
      top: box.top + pageYOffset,
      left: box.left + pageXOffset
    }
  }
   
  return {
    init,
    bindEvents
  }
})();