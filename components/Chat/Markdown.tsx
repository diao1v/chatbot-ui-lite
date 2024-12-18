import React from 'react';
import Markdown from 'react-markdown';
import { dark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { Prism, SyntaxHighlighterProps } from 'react-syntax-highlighter';
const SyntaxHighlighter = Prism as any as React.FC<SyntaxHighlighterProps>;

type MarkdownComponentProps = {
  markdown: string;
};

const MarkdownComponent: React.FC<MarkdownComponentProps> = ({ markdown }) => {
  return (
    <Markdown
      // eslint-disable-next-line react/no-children-prop
      children={markdown}
      components={{
        code(props) {
          const { children, className, node, ...rest } = props;
          const match = /language-(\w+)/.exec(className || '');
          return match ? (
            <SyntaxHighlighter
              {...rest}
              PreTag='div'
              // eslint-disable-next-line react/no-children-prop
              children={String(children).replace(/\n$/, '')}
              language={match[1]}
              style={dark}
            />
          ) : (
            <code {...rest} className={className}>
              {children}
            </code>
          );
        },
      }}
    />
  );
};

export default MarkdownComponent;
