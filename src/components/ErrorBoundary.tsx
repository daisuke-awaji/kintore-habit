import { Component, type ErrorInfo, type ReactNode } from 'react';

/** 画面の表示で問題が起きても真っ白にしない。記録は localStorage に残っている */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[kintore-habit]', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="screen">
        <h1>表示中に問題が起きました</h1>
        <p>記録はこの端末に残っています。もう一度読み込んでください。</p>
        <button
          type="button"
          className="btn btn-primary btn-xl btn-block"
          onClick={() => {
            window.location.hash = '#/';
            window.location.reload();
          }}
        >
          もう一度読み込む
        </button>
      </main>
    );
  }
}
