function booleanOptionOr ( booleanOption, defaultOption ) {
  return (typeof booleanOption === "boolean") ? booleanOption : defaultOption;
}

/**
 * Emit an event on the given element.
 *
 * @param {HTMLElement} element - DOM element to trigger the event on.
 * @param {String} eventName - Name of the triggered event.
 * @param {Object} [data={}] - Custom data to attach to the event.
 */
function emitEvent ( element, eventName, data ) {
  var event;

  if ( document.createEvent ) {
    event = document.createEvent( "HTMLEvents" );
    event.initEvent( eventName, true, true );
  } else {
    event = document.createEventObject();
    event.eventType = eventName;
  }

  event.eventName = eventName;
  event.data = data || {};

  if ( document.createEvent ) {
    element.dispatchEvent( event );
  } else {
    element.fireEvent( "on" + event.eventType, event );
  }
}

module.exports = {
  booleanOptionOr: booleanOptionOr,
  emitEvent: emitEvent
};
