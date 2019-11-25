import React, { useState } from 'react';
import classnames from 'classnames';

export default function TabBox({ content }) {
  const titles = content.map(({ title }) => title);
  const contents = content.map(({ content }) => content);

  const [selectedTab, setSelectedTab] = useState(0);
  const Content =
    contents[selectedTab] && typeof contents[selectedTab] === 'string'
      ? () => <>{contents[selectedTab]}</>
      : contents[selectedTab];

  return (
    <div className="tab-box">
      <div className="tab-box-options">
        {titles.map((title, index) => {
          const Title = title;
          const selected = index === selectedTab;
          return (
            <button
              role="tab"
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              key={index}
              className={classnames('tab-box-option', selected && 'active')}
              onClick={() => setSelectedTab(index)}
            >
              {typeof Title === 'string' ? Title : <Title />}
            </button>
          );
        })}
      </div>
      <div className="tab-box-content">
        <Content />
      </div>
    </div>
  );
}
