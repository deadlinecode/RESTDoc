import * as React from "react";
import "./Loader.scss";

export default class Loader extends React.Component<{ absolute?: boolean }> {
  render = () => (
    <div
      className="load_wrapper"
      style={{
        ...(this.props.absolute
          ? {
              position: "absolute",
              top: 0,
              left: 0,
            }
          : {}),
      }}
    >
      <span className="loader" />
    </div>
  );
}
