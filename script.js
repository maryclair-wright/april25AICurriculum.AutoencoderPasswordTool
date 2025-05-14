// script.js

// 1) Preloaded password list
const initialPasswords = [
  "3l3ph@n7","c0mpu73R","$3cur17y","p@$$w0rD","$un$h1n3",
  "n073b00K","b@ckp@cK","bu773rflY","7r1@ngl3","Bu1ld1ng",
  "M0un7@1n","d@7@b@$3","@n@ly$1$","1n73rf@c3","$0f7w@r3",
  "H@rdw@r3","3duc@710N","V3g37@bl3","Ch0c0l@73","b@$3b@lL",
  "f007b@bL","G00dn1gh7","$7@r$7rucK","w@73rf@lL","r3fl3c710N",
  "}whIspEr3zephyr","-sHaDoW1fragiLE",".fragile8OCEan",
  "&foresT0crimson","&gLimMER5zePhYr","#wind3RADiANt",
  "\"SilenT9brigHT\"",",MystiC6gentlE","+sAcrEd2bright",
  "!sWifT8crimson","!shADow1hiDden","{RadianT2BriGht",
  "&hIDdeN8ShiniNg","<sHiniNg4wINd","(oCEAn5zephYr",
  ",ZePHyr5hidDEn",")MySTIc6GentLe","(rising5fragiLE",
  "]Shadow0sereNe","(Hidden5ShINiNG","\\sHinIng6lunar",
  "/Rising3zePhYr","@mystic7aNCienT","=hidden3foreST",
  "@ThundeR4vIViD","B592teal*","P984indigo&","V815purple[",
  "N136indigo|","M569blue'","P896purple\"","B712indigo)",
  "U431yellow[","G492icy~","D161indigo|","T747vibrant@",
  "U227crimson=","Z969purple]","Z400vibrant(","Q981icy-",
  "B900golden{","L874pink|","L908scarlet%","B140maroon;",
  "A632crimson.","H195sandy_","Q412yellow*","N679teal&",
  "D525green'","N892purple","smitH/2324","johnsoN,7439",
  "williamS(7810","browN[4230","joneS)0457","garciA.5934",
  "milleR@7755","daviS=4855","rodrigueZ?3015","martineZ&1680",
  "hernandeZ>2562","lopeZ]2407","gonzaleZ)3650","wilsoN?8328",
  "andersoN:3877",
  // pass/enter variants
  "P@55s","P@55w0r","P@55w0rD","pAssw0Rd!","Pa$$w0",
  "P@ssw0","Pa55w0rd","Pa55w0Rd","EnTeR9$","ent3R#1",
  "E#t3R5","3nter!2","entEr@3","En7er!4","eNt3R%5",
  "Pa$$Ent7","p@SS!12","P@Ss1d","Pas$#6","Pa5$Entr"
];

// 2) Student‐added passwords
let userAdded = [];

// 3) Render the two‐column grid of passwords
function renderTrainingList() {
  const container = document.getElementById('training-list');
  container.textContent = '';
  const ul = document.createElement('ul');
  initialPasswords.forEach(pwd => {
    const li = document.createElement('li');
    li.textContent = pwd;
    ul.appendChild(li);
  });
  userAdded.forEach(pwd => {
    const li = document.createElement('li');
    li.textContent = pwd;
    li.classList.add('user-added');
    ul.appendChild(li);
  });
  container.appendChild(ul);
}

// 4) Turn a password into a fixed‐length numeric vector
function featurize(pwd) {
  const max = 16;
  const arr = Array(max).fill(0);
  for (let i = 0; i < Math.min(pwd.length, max); i++) {
    arr[i] = pwd.charCodeAt(i) / 128;
  }
  return arr;
}

// 5) Build a tiny autoencoder model
function makeModel() {
  const input = tf.input({shape:[16]});
  const enc   = tf.layers.dense({units:8, activation:'relu'}).apply(input);
  const dec   = tf.layers.dense({units:16, activation:'sigmoid'}).apply(enc);
  const model = tf.model({inputs: input, outputs: dec});
  model.compile({optimizer:'adam', loss:'meanSquaredError'});
  return model;
}

// 6) Train on all known passwords
async function trainModel(ae) {
  const all = initialPasswords.concat(userAdded);
  const xs  = tf.tensor2d(all.map(featurize));
  await ae.fit(xs, xs, {
    epochs: 10,
    batchSize: 16,
    shuffle: true,
    callbacks: {
      onEpochEnd: (e, logs) => console.log(`Epoch ${e+1}: loss=${logs.loss.toFixed(4)}`)
    }
  });
  xs.dispose();
}

// 7) Run anomaly check & pick top‐3 unusual positions
async function runCheck(ae, pwd) {
  const inT   = tf.tensor2d([featurize(pwd)]);
  const recon = ae.predict(inT);
  const errT  = tf.metrics.meanSquaredError(inT, recon);
  const error = (await errT.data())[0];

  const orig  = inT.arraySync()[0];
  const out   = recon.arraySync()[0];
  inT.dispose(); recon.dispose(); errT.dispose();

  // Only compare the first `pwd.length` entries
  const L     = pwd.length;
  const diffs = orig
    .slice(0, L)
    .map((v,i) => Math.abs(v - out[i]));

  // Pick top‐3 positions (1‐based)
  const top3 = diffs
    .map((d,i) => ({ pos: i+1, d }))
    .sort((a,b) => b.d - a.d)
    .slice(0,3)
    .map(o => o.pos);

  return { error, top3 };
}

// 8) Wire up UI
window.addEventListener('DOMContentLoaded', async () => {
  renderTrainingList();

  const ae = makeModel();
  console.log('⏳ Training…');
  await trainModel(ae);
  console.log('✅ Trained.');

  let lastTest = null;

  // Add button
  document.getElementById('add-button').addEventListener('click', async () => {
    const lines = document.getElementById('new-passwords').value
      .split('\n').map(l=>l.trim()).filter(l=>l);
    const fb = document.getElementById('add-feedback');
    if (lines.length < 10) {
      fb.textContent = '⚠️ Please enter at least 10 passwords.';
      return;
    }
    userAdded.push(...lines);
    renderTrainingList();
    document.getElementById('new-passwords').value = '';
    fb.textContent = `✅ Added ${lines.length} passwords.`;
    console.log('⏳ Re-training…');
    await trainModel(ae);
    console.log('✅ Re-trained.');
  });

  // Test button
  document.getElementById('test-button').addEventListener('click', async () => {
    const pwd = document.getElementById('test-input').value.trim();
    if (!pwd) return;

    const { error, top3 } = await runCheck(ae, pwd);

    // classify
    const t1 = 0.02, t2 = 0.05;
    let category, icon;
    if      (error < t1) category='Normal',           icon='✅';
    else if (error < t2) category='Almost Acceptable',icon='⚠️';
    else                 category='Anomalous',        icon='🚨';

    // show result box
    document.getElementById('test-result').innerHTML = `
      <strong>How it rebuilds:</strong>
      <p class="rebuild-def">
        To rebuild a password, the autoencoder first squashes (“encodes”) your password into a tiny set of numbers 
        that capture its main patterns, then tries to expand (“decode”) those numbers back into the original text. 
        If its rebuilt version matches your password closely, it means the model “understood” its structure well; 
        large differences show it couldn’t reconstruct the same sequence of characters and therefore flags it as unusual.
      </p>
      <hr>
      <strong>Reconstruction error</strong><br>
      <span class="error-val">${error.toFixed(4)}</span><br>
      <strong>${icon} ${category}</strong><br>
      <em>Most unusual at positions ${top3.join(', ')}</em>
    `;

    // highlight the three characters
    const highlighted = pwd
      .split('')
      .map((ch,i) =>
        top3.includes(i+1)
          ? `<span class="highlight">${ch}</span>`
          : ch
      ).join('');
    document.getElementById('highlighted-password').innerHTML = `<p>${highlighted}</p>`;

    // save for retest
    lastTest = { pwd, error, category, icon };
    document.getElementById('edit-input').value = pwd;
    document.getElementById('compare-result').textContent = '';
  });

  // Retest button
  document.getElementById('retest-button').addEventListener('click', async () => {
    if (!lastTest) return;
    const newPwd = document.getElementById('edit-input').value.trim();
    if (!newPwd) return;

    const { error: newError, top3: newTop } = await runCheck(ae, newPwd);

    const t1 = 0.02, t2 = 0.05;
    let newCat, newIcon;
    if      (newError < t1) newCat='Normal',           newIcon='✅';
    else if (newError < t2) newCat='Almost Acceptable',newIcon='⚠️';
    else                    newCat='Anomalous',        newIcon='🚨';

    const gotCloser    = newError < lastTest.error;
    const closenessMsg = gotCloser
      ? '🎉 Good job — your new password is closer to the “normal” pattern.'
      : '⚠️ Oops — this new password is actually further from normal than your first one.';
    const scaleMsg     = 'Note: Reconstruction error runs from 0.00 (perfect match) up toward 1.00 (completely different); lower is better.';

    document.getElementById('compare-result').innerHTML = `
      <div class="compare-line">
        🔍 Original (“${lastTest.pwd}”) error: ${lastTest.error.toFixed(4)} ${lastTest.icon} ${lastTest.category}
      </div>
      <div class="compare-line">
        🔍 New (“${newPwd}”)      error: ${newError.toFixed(4)} ${newIcon} ${newCat}
      </div>
      <div class="compare-feedback">${closenessMsg}</div>
      <div class="compare-scale">${scaleMsg}</div>
    `;
  });
});
