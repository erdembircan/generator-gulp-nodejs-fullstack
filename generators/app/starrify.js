module.exports.makeItFabolus = (message) => {
  const length = process.stdout.columns;
  let border = '';
  for (let i = 0; i < length; i++) {
    border += '*';
  }

  let length2 = 0;
  let pad = '';
  while (length2 < (length - 2 - message.length) / 2) {
    pad += ' ';
    length2 = pad.length;
  }

  let pad2L = 0;
  if (length % 2 === 0) {
    if (message.length % 2 === 0) {
      pad2L = 0;
    } else {
      pad2L = -1;
    }
  } else if (message.length % 2 === 0) {
    pad2L = -1;
  } else {
    pad2L = 0;
  }

  const m = `*${pad}${message}${pad.slice(0, pad.length + pad2L)}*`;

  return `\n${border}\n${m}\n${border}\n`;
};
