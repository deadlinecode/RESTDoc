import * as React from "react";
import Fx from "../../Fx";
import Icon from "../Icon/Icon";
import "./Dropdown.scss";

export interface IDropdownProps {
  options: { title: string; value: string }[];
  defaultTitle: string;
  value?: string;
  onChange?: (value: string) => void;
}

export interface IDropdownState {
  active: boolean;
}

export default class Dropdown extends React.Component<
  IDropdownProps,
  IDropdownState
> {
  constructor(props: IDropdownProps) {
    super(props);

    this.state = {
      active: false,
    };
  }

  public render() {
    return (
      <div className="Dropdown">
        <button onClick={() => this.setState({ active: !this.state.active })}>
          <Icon icon="chevron-right" />
          {this.props.value === undefined
            ? this.props.defaultTitle
            : this.props.options.find((x) => x.value === this.props.value)
                ?.title}
        </button>
        <div
          className={Fx.c(["Dropdown__List", this.state.active && "active"])}
        >
          {this.props.options.map((item, i) => (
            <div
              className="Dropdown__List__Item"
              key={i}
              onClick={() =>
                this.setState(
                  { active: false },
                  () => this.props.onChange && this.props.onChange(item.value)
                )
              }
            >
              {item.title}
            </div>
          ))}
        </div>
      </div>
    );
  }
}
