import * as React from "react";
import Engine from "./Engine";
import "./Explorer.scss";
import Init from "./Init";

export interface IExplorerProps {
  page: string;
}

export interface IExplorerState {}

export default class Explorer extends React.Component<
  IExplorerProps,
  IExplorerState
> {
  constructor(props: IExplorerProps) {
    super(props);

    this.state = {};
  }

  renderMain = () => {
    switch (this.props.page) {
      case "init":
        return <Init />;
      case "home":
        return <Engine />;
      default:
        return null;
    }
  };

  render = () => <div id="Explorer">{this.renderMain()}</div>;
}
