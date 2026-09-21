import React from 'react';

const ChatMessageContent = ({ text }) => {
  if (!text) return null;

  // Split by newlines
  const lines = text.split('\n').filter(line => line.trim() !== '');

  const elements = [];
  let listItems = [];
  let listType = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Bullet points (* or -)
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      if (listType !== 'bullet') {
        if (listItems.length > 0) {
          elements.push(
            <ul key={`list-${i}`} style={{ margin: '8px 0', paddingLeft: '20px' }}>
              {listItems.map((item, idx) => <li key={idx}>{item}</li>)}
            </ul>
          );
          listItems = [];
        }
        listType = 'bullet';
      }
      listItems.push(trimmed.substring(2));
      continue;
    }

    // Numbered lists (1. item)
    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numberedMatch) {
      if (listType !== 'number') {
        if (listItems.length > 0) {
          elements.push(
            <ol key={`list-${i}`} style={{ margin: '8px 0', paddingLeft: '20px' }}>
              {listItems.map((item, idx) => <li key={idx}>{item}</li>)}
            </ol>
          );
          listItems = [];
        }
        listType = 'number';
      }
      listItems.push(numberedMatch[2]);
      continue;
    }

    // Close any open list
    if (listItems.length > 0) {
      if (listType === 'bullet') {
        elements.push(
          <ul key={`list-${i}`} style={{ margin: '8px 0', paddingLeft: '20px' }}>
            {listItems.map((item, idx) => <li key={idx}>{item}</li>)}
          </ul>
        );
      } else if (listType === 'number') {
        elements.push(
          <ol key={`list-${i}`} style={{ margin: '8px 0', paddingLeft: '20px' }}>
            {listItems.map((item, idx) => <li key={idx}>{item}</li>)}
          </ol>
        );
      }
      listItems = [];
      listType = null;
    }

    // Regular paragraph
    elements.push(<p key={`p-${i}`} style={{ margin: '6px 0' }}>{trimmed}</p>);
  }

  // Flush remaining list items
  if (listItems.length > 0) {
    if (listType === 'bullet') {
      elements.push(
        <ul key="list-end" style={{ margin: '8px 0', paddingLeft: '20px' }}>
          {listItems.map((item, idx) => <li key={idx}>{item}</li>)}
        </ul>
      );
    } else if (listType === 'number') {
      elements.push(
        <ol key="list-end" style={{ margin: '8px 0', paddingLeft: '20px' }}>
          {listItems.map((item, idx) => <li key={idx}>{item}</li>)}
        </ol>
      );
    }
  }

  return <div>{elements}</div>;
};

export default ChatMessageContent;