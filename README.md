# april25AICurriculum.AutoencoderPasswordTool
A web-based password anomaly explorer built with HTML, CSS, and JavaScript using TensorFlow.js to train and run an autoencoder model in-browser for password strength evaluation and anomaly detection.

Developed in April 2025 as a student-facing tool for a high school AI course, this web-based Password Anomaly Explorer lets learners interact with an untrained autoencoder model entirely in the browser, experimenting with password creation and observing reconstruction errors to see how the model learns patterns .
The index.html and styles.css files deliver a clean ASCTE-branded interface for viewing the preloaded training set, adding student-defined passwords, and highlighting anomalies with clear visual feedback .
All core modeling—including featurizing passwords, building and training a tiny TensorFlow.js autoencoder, and computing reconstruction error for anomaly detection—is implemented in script.js to give students hands-on insight into how their inputs shape the untrained model’s behavior .
The testingPasswords.txt file provides a sample set of common, animal-themed passwords to prime the model and establish a baseline before students add their own entries and refine their password-design skills indextestingPasswords.
