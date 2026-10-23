export function HealthNotes() {
  return (
    <div className="health">
      <p>次にあてはまる方は、始める前に医師に相談してください。</p>
      <ul>
        <li>心臓の病気や高血圧などで治療中、または医師から運動を止められている</li>
        <li>妊娠中、または産後まもない</li>
        <li>ひざ・腰・肩などに痛みがある</li>
        <li>運動中に、胸の痛み・息苦しさ・めまいを感じたことがある</li>
      </ul>
      <p><strong>運動中に痛みや気分の悪さを感じたら、すぐにやめてください。</strong></p>
      <p className="muted">このアプリは医療のアドバイスではありません。</p>
    </div>
  );
}
