import { FigureSvg } from '../components/Figure';
import { EXERCISES } from '../domain/exercises';
import { skeletonOf } from '../domain/pose';

/** 開発用：全ポーズの一覧（#/dev/poses） */
export function PoseGallery() {
  return (
    <main className="screen gallery">
      <h1>ポーズ一覧（開発用）</h1>
      {EXERCISES.map((ex) => (
        <section key={ex.id} className="card">
          <h2>{ex.name}（{ex.id}）</h2>
          <div className="gallery-grid">
            {Object.entries(ex.poses).map(([name, pose]) => (
              <figure key={name}>
                <FigureSvg skeleton={skeletonOf(pose)} prop={ex.prop} label={name} />
                <figcaption>{name}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
