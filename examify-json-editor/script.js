document.addEventListener('DOMContentLoaded', () => {
    // --- STATE ---
    let questionsData = []; 
    let editorInstance = null;
    let currentEditIndex = -1; 
    let questionModalInstance = null;
    let importModalInstance = null;
    let exportModalInstance = null;
    let loadingModalInstance = null;
    let helpModalInstance = null;

    const GITHUB_QUESTIONS_REPO_RAW_BASE_URL = 'https://raw.githubusercontent.com/Samkarya/online-exam-questions/main/';

    const TEMPLATES = {
        basic: [
            { 
                name: "Simple MCQ", icon: "fa-list-ol", 
                data: [{ question_number: 1, question_text: "What is 2+2?", options: { "a": "3", "b": "4", "c": "5" }, correct_answer: "b", difficulty: "Easy", subject: null, topic: null, section_id: null, explanation: null }]
            },
            { 
                name: "MCQ with Explanation", icon: "fa-comment-alt", 
                data: [{ question_number: 1, question_text: "Which planet is known as the Red Planet?", options: { "a": "Earth", "b": "Mars", "c": "Jupiter" }, correct_answer: "b", explanation: "Mars is known as the Red Planet due to iron oxide prevalent on its surface.", difficulty: "Easy", subject: "Science", topic: "Astronomy", section_id: null }]
            },
        ],
        subjects: [
             { 
                name: "Math (Algebra)", icon: "fa-calculator", 
                data: [{ question_number: 1, subject: "Mathematics", topic: "Algebra", difficulty: "Medium", section_id: "AlgebraBasics", question_text: "If $2x + 3 = 7$, what is $x$?", options: { "a": "1", "b": "2", "c": "3", "d": "4" }, correct_answer: "b", explanation: "To solve for $x$:\n1. Subtract 3 from both sides: $2x + 3 - 3 = 7 - 3 \\implies 2x = 4$.\n2. Divide by 2: $x = \\frac{4}{2} \\implies x = 2$." }]
            },
            {
                name: "Physics (Optics)", icon: "fa-lightbulb",
                data: [{ question_number: 1, subject: "Physics", topic: "Optics", difficulty: "Medium", section_id: "Optics-Fundamentals", question_text: "What phenomenon causes a rainbow, involving splitting of white light into its constituent colors?", options: { "a": "Reflection", "b": "Refraction", "c": "Dispersion", "d": "Diffraction" }, correct_answer: "c", explanation: "Rainbows are formed due to dispersion of sunlight by raindrops, which involves refraction and total internal reflection. Dispersion is the splitting of white light." }]
            }
        ],
        complex: [
            { 
                name: "LaTeX (Display Math)", icon: "fa-square-root-alt", 
                data: [{ question_number: 1, difficulty: "Hard", subject:"Mathematics", topic:"Calculus", section_id: null, question_text: "What is the value of the integral $$\\int_0^1 x^2 dx$$ ?", options: { "a": "1/3", "b": "1/2", "c": "1", "d": "2/3" }, correct_answer: "a", explanation: "The integral is evaluated as: $$\\int_0^1 x^2 dx = \\left[ \\frac{x^3}{3} \\right]_0^1 = \\frac{1^3}{3} - \\frac{0^3}{3} = \\frac{1}{3}$$" }]
            },
            { 
                name: "Code Block (Python)", icon: "fa-code", 
                data: [{ question_number: 1, difficulty: "Medium", subject:"Programming", topic:"Python", section_id: null, question_text: "What is the output of the following Python code?\n\n```python\ndef greet(name):\n  return f\"Hello, {name}!\"\n\nmessage = greet(\"Examify\")\nprint(message)\n```", options: { "a": "Hello, name!", "b": "Hello, Examify!", "c": "Syntax Error", "d": "None" }, correct_answer: "b", explanation: "The function `greet` formats a string with the provided name. When called with \"Examify\", it returns \"Hello, Examify!\", which is then printed." }]
            },
            { 
                name: "Image Question (Relative Path)", icon: "fa-image", 
                data: [{ question_number: 1, subject: "General Knowledge", topic: "Diagrams", difficulty: "Easy", section_id:"Visuals", question_text: "The following diagram shows a basic electric circuit. Identify component 'X'.\n\n![Circuit Diagram Example](assets/placeholder_circuit.png)", options: { "a": "Resistor", "b": "Capacitor", "c": "Battery", "d": "Switch" }, correct_answer: "d", explanation: "Component 'X' in a typical simple circuit diagram could be a switch. (Note: `assets/placeholder_circuit.png` should exist in the GitHub repo for this to render)." }]
            },
             { 
                name: "Chemistry (mhchem)", icon: "fa-flask", 
                data: [{ question_number: 1, subject: "Chemistry", topic: "Reactions", difficulty: "Medium", section_id: "ChemEq", question_text: "What is the balanced chemical equation for the reaction of methane with oxygen to produce carbon dioxide and water?\nUse `\\ce{}` for formulas, e.g., `$\\ce{H2O}$`.", options: { "a": "$\\ce{CH4 + O2 -> CO2 + H2O}$", "b": "$\\ce{CH4 + 2O2 -> CO2 + 2H2O}$", "c": "$\\ce{2CH4 + O2 -> 2CO2 + H2O}$", "d": "$\\ce{CH4 + O2 -> CO + 2H2O}$" }, correct_answer: "b", explanation: "The balanced equation is $\\ce{CH4 + 2O2 -> CO2 + 2H2O}$. This ensures the same number of atoms of each element on both sides of the reaction." }]
            },
        ]
    };

    const dom = {
        sidebar: document.getElementById('sidebar'),
        sidebarToggle: document.getElementById('sidebarToggle'),
        toggleIcon: document.getElementById('toggleIcon'),
        mainContent: document.getElementById('mainContent'),
        questionModal: document.getElementById('questionModal'),
        importModal: document.getElementById('importModal'),
        exportModal: document.getElementById('exportModal'),
        loadingModal: document.getElementById('loadingModal'),
        helpModal: document.getElementById('helpModal'),
        questionsAccordion: document.getElementById('questionsAccordion'),
        noQuestionsAlert: document.getElementById('noQuestionsAlert'),
        addQuestionBtn: document.getElementById('addQuestionBtn'),
        jsonStatus: document.getElementById('jsonStatus'),
        questionCount: document.getElementById('questionCount'),
        validationErrorMessage: document.getElementById('validationErrorMessage'),
        validationErrorText: document.getElementById('validationErrorText'),
        validateFormBtn: document.getElementById('validateFormBtn'),
        syncToJsonBtn: document.getElementById('syncToJsonBtn'),
        questionForm: document.getElementById('questionForm'),
        questionModalTitle: document.getElementById('questionModalTitle'),
        editQuestionIndexInput: document.getElementById('editQuestionIndex'),
        questionNumberInput: document.getElementById('questionNumber'),
        difficultySelect: document.getElementById('difficulty'),
        subjectInput: document.getElementById('subject'),
        topicInput: document.getElementById('topic'),
        sectionIdInput: document.getElementById('sectionId'),
        questionTextInput: document.getElementById('questionText'),
        optionsModalContainer: document.getElementById('optionsModalContainer'),
        addOptionModalBtn: document.getElementById('addOptionModalBtn'),
        explanationInput: document.getElementById('explanation'),
        saveQuestionBtn: document.getElementById('saveQuestionBtn'),
        jsonEditorTextarea: document.getElementById('jsonEditorTextarea'),
        validateJsonEditorBtn: document.getElementById('validateJsonEditorBtn'),
        syncToFormBtn: document.getElementById('syncToFormBtn'),
        jsonEditorStatus: document.getElementById('jsonEditorStatus'),
        previewContainer: document.getElementById('previewContainer'),
        previewAlert: document.getElementById('previewAlert'),
        previewAlertText: document.getElementById('previewAlertText'),
        noPreviewContent: document.getElementById('noPreviewContent'),
        refreshPreviewBtn: document.getElementById('refreshPreviewBtn'),
        importBtnTrigger: document.getElementById('importBtnTrigger'),
        exportBtnTrigger: document.getElementById('exportBtnTrigger'),
        importFileRadio: document.getElementById('importFileRadio'),
        importPasteRadio: document.getElementById('importPasteRadio'),
        importFileSection: document.getElementById('importFileSection'),
        importPasteSection: document.getElementById('importPasteSection'),
        dropzoneArea: document.getElementById('dropzoneArea'),
        fileInput: document.getElementById('fileInput'),
        dropzoneFileName: document.getElementById('dropzoneFileName'),
        pasteJsonTextarea: document.getElementById('pasteJsonTextarea'),
        importJsonBtn: document.getElementById('importJsonBtn'),
        fileNameInput: document.getElementById('fileNameInput'),
        formatJsonCheckbox: document.getElementById('formatJsonCheckbox'),
        confirmExportBtn: document.getElementById('confirmExportBtn'),
        templateCategorySelect: document.getElementById('templateCategory'),
        templatesListDiv: document.getElementById('templatesList'),
        validateGlobalBtn: document.getElementById('validateGlobalBtn'),
        formEditorTab: new bootstrap.Tab(document.getElementById('form-tab')),
        jsonEditorTab: new bootstrap.Tab(document.getElementById('json-tab')),
        previewTab: new bootstrap.Tab(document.getElementById('preview-tab')),
        templatesLoading: document.getElementById('templatesLoading'),
    };

    const showToast = (message, type = 'info', duration = 3000) => {
        const backgroundColor = {
            success: 'linear-gradient(to right, #00b09b, #96c93d)',
            error: 'linear-gradient(to right, #ff5f6d, #ffc371)',
            info: 'linear-gradient(to right, #007bff, #00c6ff)',
            warning: 'linear-gradient(to right, #f09819, #ff5858)',
        }[type] || 'linear-gradient(to right, #007bff, #00c6ff)';
        
        Toastify({
            text: message,
            duration: duration,
            close: true,
            gravity: "top",
            position: "right",
            style: { background: backgroundColor },
            className: "toast-notification", 
        }).showToast();
    };

    const showLoading = (title = "Processing...", text = "Please wait.") => {
        if (loadingModalInstance) {
            document.getElementById('loadingModalTitle').textContent = title;
            document.getElementById('loadingModalText').textContent = text;
            loadingModalInstance.show();
        }
    };
    const hideLoading = () => {
        if (loadingModalInstance) {
            loadingModalInstance.hide();
        }
    };
    
    function transformImageUri(uri) {
        if (!uri || typeof uri !== 'string') return '';
        if (uri.startsWith('https://') || uri.startsWith('data:image')) {
            return uri;
        } else if (uri.startsWith('http://')) {
            console.warn('Insecure HTTP image URL skipped in preview:', uri);
            return '#INVALID_HTTP_URL'; 
        } else if (!uri.includes(':') || uri.startsWith('/')) { // Relative path (allow starting with /)
            const cleanedUri = uri.startsWith('/') ? uri.substring(1) : uri;
            return `${GITHUB_QUESTIONS_REPO_RAW_BASE_URL}${cleanedUri}`;
        } else {
            console.warn('Unsupported image URI scheme skipped in preview:', uri);
            return '#UNSUPPORTED_SCHEME';
        }
    }

    const markedGlobalRenderer = new marked.Renderer();
    markedGlobalRenderer.image = function(href, title, text) {
        const resolvedSrc = transformImageUri(href);
        const altText = text || title || 'Image'; // Ensure some alt text
        if (!resolvedSrc || resolvedSrc.startsWith('#INVALID') || resolvedSrc.startsWith('#UNSUPPORTED')) {
             return `<span class="rendered-image-error" title="Original src: ${href || ''}">[Image: ${altText} - Load Error]</span>`;
        }
        return `<img src="${resolvedSrc}" alt="${altText}" title="${title || ''}" style="max-width: 100%; height: auto; display: block; margin: 0.5em 0;" loading="lazy" />`;
    };
    
    // Configure marked.js
    marked.setOptions({
        renderer: markedGlobalRenderer, // Use the custom renderer
        pedantic: false,
        gfm: true,
        breaks: true,
        sanitize: false, // DOMPurify will handle sanitization
        mangle: false, // Disable deprecated mangle
        headerIds: false, // Disable deprecated headerIds
        // The 'highlight' option is removed as it's deprecated. Prism.js will handle it.
    });

    const renderRichText = (text, targetElement) => {
        if (text === null || typeof text === 'undefined') {
            targetElement.innerHTML = '';
            return;
        }
        const textString = String(text);
        let rawHtml = marked.parse(textString); // Uses the globally configured marked
        
        let sanitizedHtml = DOMPurify.sanitize(rawHtml, { 
            USE_PROFILES: { html: true }, 
            ADD_TAGS: ['math', 'mstyle', 'mtable', 'mtr', 'mtd', 'msup', 'msub', 'mfrac', 'mi', 'mo', 'mn', 'mtext', 'semantics', 'annotation', 'merror', 'mrow', 'annotation-xml'],
            ADD_ATTR: ['encoding', 'definitionURL', 'mathvariant', 'mathsize', 'displaystyle', 'xmlns', 'accent', 'accentunder', 'src', 'alt'] // 'src' and 'alt' for MathML if KaTeX generates it
        });
        targetElement.innerHTML = sanitizedHtml;

        // KaTeX rendering
        try {
            if (typeof window.renderMathInElement === 'function') {
                window.renderMathInElement(targetElement, {
                    delimiters: [
                        {left: "$$", right: "$$", display: true}, {left: "$", right: "$", display: false},
                        {left: "\\(", right: "\\)", display: false}, {left: "\\[", right: "\\]", display: true}
                    ],
                    throwOnError: false,
                    trust: (context) => context.command === '\\ce' || context.command === '\\pu',
                });
            } else {
                console.warn("KaTeX auto-render (renderMathInElement) is not available. Math will not be rendered.");
                showToast("KaTeX auto-render not available. Math might not display.", "warning", 5000);
            }
        } catch (e) {
            console.error("KaTeX rendering error:", e);
            showToast(`KaTeX Error: ${String(e.message).substring(0,100)}...`, 'error', 5000);
        }
        
        // PrismJS highlighting
        // Ensure <pre> tags get the line-numbers class for Prism's line number plugin
        targetElement.querySelectorAll('pre code[class*="language-"]').forEach(codeBlock => {
            const pre = codeBlock.parentElement;
            if (pre && pre.tagName === 'PRE' && !pre.classList.contains('line-numbers')) {
                pre.classList.add('line-numbers');
            }
        });
        // Highlight all code blocks under the target element using Prism
        if (typeof Prism !== 'undefined' && typeof Prism.highlightAllUnder === 'function') {
             Prism.highlightAllUnder(targetElement);
        } else {
            console.warn("Prism.js or highlightAllUnder not available. Code syntax highlighting may not work.");
        }
    };

    const validateJsonStructure = (jsonString) => {
        let data;
        try { data = JSON.parse(jsonString); } 
        catch (err) { throw new SyntaxError(`Invalid JSON syntax: ${err.message}. Check for missing/extra commas, quotes, or brackets.`); }

        if (!Array.isArray(data)) throw new Error("Invalid format: Top level must be an array of question objects (e.g., `[{...}, {...}]`).");
        
        const qNumbers = new Set();
        let previousQNumber = 0; 
        const errorMessages = [];

        data.forEach((q, index) => {
            const qNumForError = q && q.question_number !== undefined ? q.question_number : `(at index ${index})`;
            if (typeof q !== 'object' || q === null) { errorMessages.push(`Item at index ${index} (Q#${qNumForError}) must be an object.`); return; }
            
            if (typeof q.question_number !== 'number' || !Number.isInteger(q.question_number) || q.question_number <= 0) errorMessages.push(`Q#${qNumForError}: 'question_number' must be a positive integer.`);
            if (qNumbers.has(q.question_number)) errorMessages.push(`Q#${q.question_number}: 'question_number' is duplicated. Must be unique.`);
            else qNumbers.add(q.question_number);
            
            if (q.question_number < previousQNumber && index > 0 && errorMessages.length == 0) { 
                console.warn(`Warning: Q#${q.question_number} is not strictly sequential with previous Q#${previousQNumber}. Consider reordering.`);
            }
            previousQNumber = q.question_number;

            if (typeof q.question_text !== 'string' || q.question_text.trim() === '') errorMessages.push(`Q#${q.question_number}: 'question_text' must be a non-empty string.`);
            if (typeof q.options !== 'object' || q.options === null || Object.keys(q.options).length < 2) errorMessages.push(`Q#${q.question_number}: 'options' must be an object with at least two key-value pairs.`);
            else { for (const key in q.options) { if (typeof q.options[key] !== 'string') errorMessages.push(`Q#${q.question_number} option '${key}' value must be a string.`); }}
            if (typeof q.correct_answer !== 'string' || !q.options || !q.options.hasOwnProperty(q.correct_answer)) errorMessages.push(`Q#${q.question_number}: 'correct_answer' ("${q.correct_answer}") must match an existing option key.`);

            if (q.hasOwnProperty('subject') && q.subject !== null && (typeof q.subject !== 'string' || q.subject.trim() === '')) errorMessages.push(`Q#${q.question_number}: 'subject', if present and not null, must be a non-empty string.`);
            if (q.hasOwnProperty('topic') && q.topic !== null && (typeof q.topic !== 'string' || q.topic.trim() === '')) errorMessages.push(`Q#${q.question_number}: 'topic', if present and not null, must be a non-empty string.`);
            if (q.hasOwnProperty('explanation') && q.explanation !== null && typeof q.explanation !== 'string') errorMessages.push(`Q#${q.question_number}: 'explanation', if present and not null, must be a string (can be empty).`);
            if (q.hasOwnProperty('difficulty') && q.difficulty !== null && (typeof q.difficulty !== 'string' || (q.difficulty !== '' && !['Easy', 'Medium', 'Hard'].includes(q.difficulty)))) errorMessages.push(`Q#${q.question_number}: 'difficulty', if present and not null, must be "Easy", "Medium", "Hard", or an empty string.`);
            if (q.hasOwnProperty('section_id') && q.section_id !== null && (typeof q.section_id !== 'string' || q.section_id.trim() === '')) errorMessages.push(`Q#${q.question_number}: 'section_id', if present and not null, must be a non-empty string.`);

            const allowedKeys = ['question_number', 'question_text', 'options', 'correct_answer', 'subject', 'topic', 'explanation', 'difficulty', 'section_id'];
            for (const key in q) { if (!allowedKeys.includes(key) && !key.startsWith('_comment')) console.warn(`Warning: Q#${q.question_number} has an unrecognized field '${key}'. It will be included but may not be used.`);}
        });

        if (errorMessages.length > 0) throw new Error(errorMessages.join('\n'));
        return data; 
    };
    
    const performValidation = (source = 'form') => {
        let jsonDataString;
        let parsedData;
        let nonSequentialWarningMessages = [];

        try {
            if (source === 'json_editor' && editorInstance) { // Ensure editorInstance exists
                jsonDataString = editorInstance.getValue();
            } else {
                jsonDataString = JSON.stringify(questionsData, null, 2);
            }

            // If jsonDataString is empty and source is json_editor, treat as empty array for validation
            // This can happen if the editor is cleared by the user.
            if (source === 'json_editor' && jsonDataString.trim() === "") {
                jsonDataString = "[]";
                 if (editorInstance) editorInstance.setValue("[]", " कार्यक्रमा"); // Set editor to "[]" without triggering its own change event for this
            }


            parsedData = validateJsonStructure(jsonDataString);

            let prevQNumValidation = 0;
            const sortedForValidation = [...parsedData].sort((a, b) => (a.question_number || 0) - (b.question_number || 0));
            sortedForValidation.forEach((q, index) => { // Added index here
                if ((q.question_number > prevQNumValidation + 1) && prevQNumValidation !== 0 && index > 0) {
                    nonSequentialWarningMessages.push(`Warning: Gap detected. Q#${q.question_number} follows Q#${prevQNumValidation} after sorting.`);
                }
                prevQNumValidation = q.question_number;
            });

            questionsData = sortedForValidation;

            dom.jsonStatus.className = 'status-badge status-valid';
            dom.jsonStatus.innerHTML = '<i class="fas fa-check-circle"></i> Valid';
            dom.validationErrorMessage.style.display = 'none';
            dom.validationErrorText.textContent = '';

            if (source === 'json_editor') {
                dom.jsonEditorStatus.className = 'alert alert-success p-2 small mb-0';
                dom.jsonEditorStatus.textContent = 'JSON is valid!';
                dom.jsonEditorStatus.style.display = 'block';
            }

            showToast('JSON is valid!', 'success');
            if (nonSequentialWarningMessages.length > 0) {
                nonSequentialWarningMessages.forEach(warnMsg => showToast(warnMsg, 'warning', 5000));
            }

            updateQuestionCount();
            renderQuestionListAccordion();

            // Update editor if data was changed (e.g., by sorting or if form was source)
            // Only try to parse editorInstance.getValue() if it's not empty.
            if (editorInstance) {
                const currentEditorValue = editorInstance.getValue();
                const newQuestionsDataString = JSON.stringify(questionsData, null, 2);
                let editorNeedsUpdate = false;

                if (currentEditorValue.trim() === "") { // If editor was empty, now it has data
                    editorNeedsUpdate = true;
                } else {
                    try {
                        // Compare normalized JSON strings
                        const normalizedEditorJson = JSON.stringify(JSON.parse(currentEditorValue), null, 2);
                        if (normalizedEditorJson !== newQuestionsDataString) {
                            editorNeedsUpdate = true;
                        }
                    } catch (e) {
                        // If editor content is not valid JSON, it definitely needs update if questionsData is valid
                        console.warn("Editor content was not valid JSON during comparison, will update if questionsData is valid.");
                        editorNeedsUpdate = true;
                    }
                }
                
                if (editorNeedsUpdate) {
                    // Use 'setValue' but be careful about cursor position and history.
                    // For simple updates from validation, direct setValue is usually fine.
                    editorInstance.setValue(newQuestionsDataString);
                    if (source !== 'form') { // Don't toast if validation originated from form and just updated editor
                       // showToast('JSON editor updated with validated data.', 'info');
                    }
                }
            }
            return true;
        } catch (error) {
            dom.jsonStatus.className = 'status-badge status-invalid';
            dom.jsonStatus.innerHTML = '<i class="fas fa-times-circle"></i> Invalid';
            dom.validationErrorMessage.style.display = 'block';
            dom.validationErrorText.innerHTML = error.message.replace(/\n/g, '<br>');

            if (source === 'json_editor') {
                dom.jsonEditorStatus.className = 'alert alert-danger p-2 small mb-0';
                dom.jsonEditorStatus.innerHTML = `Error: ${error.message.replace(/\n/g, '<br>')}`;
                dom.jsonEditorStatus.style.display = 'block';
            }

            showToast(`Validation Error: ${error.message.split('\n')[0].substring(0, 100)}... (see details)`, 'error', 5000);
            console.error("Validation Error:", error);
            return false;
        }
    };

    const initCodeMirror = () => {
        if (editorInstance) return;

        // Function to initialize CodeMirror once jsonlint is ready
        const initializeCm = () => {
            try {
                editorInstance = CodeMirror.fromTextArea(dom.jsonEditorTextarea, {
                    lineNumbers: true,
                    mode: "application/json",
                    theme: "dracula",
                    gutters: ["CodeMirror-lint-markers"],
                    lint: !!window.jsonlint, // Only enable linting if jsonlint is available
                    matchBrackets: true,
                    autoCloseBrackets: true,
                });
                editorInstance.on("change", () => { dom.jsonEditorStatus.style.display = 'none'; });
                // Set initial value after instance is created
                if (questionsData && questionsData.length > 0) {
                    editorInstance.setValue(JSON.stringify(questionsData, null, 2));
                } else {
                    editorInstance.setValue("[]"); // Default to an empty array
                }

            } catch (e) {
                console.error("CodeMirror initialization failed:", e);
                dom.jsonEditorTextarea.style.display = "block";
                dom.jsonEditorTextarea.value = "Error: CodeMirror failed to load. Plain text area enabled.";
                showToast("CodeMirror failed to load. JSON editor functionality limited.", "error", 7000);
            }
        };

        // Check if jsonlint is available, if not, wait a bit.
        if (typeof window.jsonlint === 'undefined' || typeof window.jsonlint.parse === 'undefined') {
            console.warn("window.jsonlint is not defined yet. Retrying CodeMirror init shortly...");
            showToast("Waiting for JSON Linter dependency...", "info", 2000);
            setTimeout(() => {
                if (typeof window.jsonlint === 'undefined' || typeof window.jsonlint.parse === 'undefined') {
                    console.error("jsonlint still not available after delay. CodeMirror linting will be disabled.");
                    showToast("JSON Linter (jsonlint) failed to load. Linting disabled.", "warning", 7000);
                } else {
                     console.log("jsonlint is now available.");
                }
                initializeCm(); // Attempt to initialize anyway, lint option will handle jsonlint presence
            }, 200); // Increased delay slightly
        } else {
            console.log("jsonlint is available immediately.");
            initializeCm();
        }
    };
    
    const updateQuestionCount = () => {
         dom.questionCount.textContent = `${questionsData.length} question${questionsData.length !== 1 ? 's' : ''}`;
    };

    const sanitizeForHTMLAttribute = (str) => {
        if (typeof str !== 'string') return '';
        return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    };
    
    const renderQuestionListAccordion = () => {
        dom.questionsAccordion.innerHTML = ''; 
        if (questionsData.length === 0) { dom.noQuestionsAlert.style.display = 'block'; return; }
        dom.noQuestionsAlert.style.display = 'none';

        // questionsData should already be sorted by performValidation or import
        questionsData.forEach((q, index) => { // Use actual index in potentially sorted questionsData
            const accordionItemId = `q-item-${index}`;
            const collapseId = `q-collapse-${index}`;
            
            let questionTitlePreview = 'Untitled Question';
            if (q.question_text) {
                const tempDiv = document.createElement('div');
                // Temporarily render to get text content, avoid full rich text processing if possible for performance
                tempDiv.innerHTML = DOMPurify.sanitize(marked.parse(q.question_text));
                questionTitlePreview = tempDiv.textContent || tempDiv.innerText || ''; 
                questionTitlePreview = questionTitlePreview.replace(/\s+/g, ' ').trim(); 
                questionTitlePreview = questionTitlePreview.substring(0, 80) + (questionTitlePreview.length > 80 ? '...' : '');
            }
            
            const itemHtml = `
                <div class="accordion-item" id="accordion-item-obj-${index}">
                    <h2 class="accordion-header" id="q-heading-${index}">
                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" 
                                data-bs-target="#${collapseId}" aria-expanded="false" aria-controls="${collapseId}">
                            <strong class="me-2">Q ${q.question_number || (index + 1)}:</strong>
                            <span class="flex-grow-1 text-truncate" style="max-width: calc(100% - 150px);">${sanitizeForHTMLAttribute(questionTitlePreview)}</span>
                        </button>
                    </h2>
                    <div id="${collapseId}" class="accordion-collapse collapse" aria-labelledby="q-heading-${index}" data-bs-parent="#questionsAccordion">
                        <div class="accordion-body small">
                            <p class="mb-1"><strong>Subject:</strong> ${sanitizeForHTMLAttribute(q.subject || 'N/A')}</p>
                            <p class="mb-1"><strong>Topic:</strong> ${sanitizeForHTMLAttribute(q.topic || 'N/A')}</p>
                            <p class="mb-1"><strong>Section ID:</strong> ${sanitizeForHTMLAttribute(q.section_id || 'N/A')}</p>
                            <p class="mb-2"><strong>Difficulty:</strong> ${sanitizeForHTMLAttribute(q.difficulty || 'N/A')}</p>
                            <p><strong class="text-success">Correct Answer:</strong> ${sanitizeForHTMLAttribute(q.correct_answer || 'N/A')}</p>
                            <div class="mt-3">
                                <button class="btn btn-sm btn-outline-primary edit-question-btn" data-index="${index}" title="Edit Question"><i class="fas fa-pencil-alt me-1"></i> Edit</button>
                                <button class="btn btn-sm btn-outline-danger delete-question-btn ms-2" data-index="${index}" title="Delete Question"><i class="fas fa-trash-alt me-1"></i> Delete</button>
                                <button class="btn btn-sm btn-outline-info duplicate-question-btn ms-2" data-index="${index}" title="Duplicate Question"><i class="fas fa-copy me-1"></i> Duplicate</button>
                            </div>
                        </div>
                    </div>
                </div>`;
            dom.questionsAccordion.insertAdjacentHTML('beforeend', itemHtml);
        });
    };
    
    const renderOptionInModal = (key = '', value = '', isCorrect = false, optionIndex = 0) => {
        const optionId = `option-key-${Date.now()}-${optionIndex}`; 
        const html = `
            <div class="option-row mb-2 p-2 border rounded" data-option-index="${optionIndex}">
                <input type="radio" name="correctAnswerRadio" class="form-check-input option-radio me-2" ${isCorrect ? 'checked' : ''} title="Mark as correct answer">
                <input type="text" class="form-control form-control-sm option-key me-2" value="${sanitizeForHTMLAttribute(key)}" placeholder="Key (e.g., a)">
                <textarea class="form-control form-control-sm option-value flex-grow-1" rows="1" placeholder="Option text (supports rich content)">${sanitizeForHTMLAttribute(value)}</textarea>
                <button type="button" class="btn btn-sm btn-outline-danger remove-option-btn ms-2" title="Remove this option"><i class="fas fa-times"></i></button>
            </div>`;
        dom.optionsModalContainer.insertAdjacentHTML('beforeend', html);
        const textarea = dom.optionsModalContainer.lastElementChild.querySelector('.option-value');
        textarea.addEventListener('input', () => {
            textarea.style.height = 'auto';
            textarea.style.height = (textarea.scrollHeight) + 'px';
        });
        // Call explicitly after setting value if needed, or on first render
        setTimeout(() => { // Ensure DOM is updated
            textarea.style.height = 'auto';
            textarea.style.height = (textarea.scrollHeight) + 'px';
        }, 0);
    };

    const loadQuestionIntoModalForm = (question, index) => {
        currentEditIndex = index;
        dom.questionModalTitle.textContent = `Edit Question (Q# ${question.question_number})`;
        dom.editQuestionIndexInput.value = index; // This index is into the current `questionsData` array
        dom.questionNumberInput.value = question.question_number || '';
        dom.difficultySelect.value = question.difficulty || '';
        dom.subjectInput.value = question.subject || '';
        dom.topicInput.value = question.topic || '';
        dom.sectionIdInput.value = question.section_id || '';
        dom.questionTextInput.value = question.question_text || '';
        dom.explanationInput.value = question.explanation || '';
        dom.optionsModalContainer.innerHTML = ''; 
        if (question.options && typeof question.options === 'object') {
            let optionIndex = 0;
            for (const key in question.options) {
                renderOptionInModal(key, question.options[key], key === question.correct_answer, optionIndex++);
            }
        }
        questionModalInstance.show();
    };

    const clearQuestionModalForm = () => {
        currentEditIndex = -1;
        dom.questionModalTitle.textContent = 'Add New Question';
        dom.questionForm.reset(); 
        dom.difficultySelect.value = ""; 
        dom.editQuestionIndexInput.value = "-1";
        dom.optionsModalContainer.innerHTML = '';
        const nextQNum = questionsData.length > 0 
            ? Math.max(0, ...questionsData.map(q => q.question_number || 0).filter(n => typeof n === 'number' && isFinite(n))) + 1
            : 1;
        dom.questionNumberInput.value = nextQNum;
        renderOptionInModal('a', '', true, 0);
        renderOptionInModal('b', '', false, 1);
    };

    const saveQuestionFromModal = () => {
        const qNumber = parseInt(dom.questionNumberInput.value, 10);
        const qText = dom.questionTextInput.value; 
        const difficulty = dom.difficultySelect.value || null; 
        const subject = dom.subjectInput.value.trim() || null;
        const topic = dom.topicInput.value.trim() || null;
        const sectionId = dom.sectionIdInput.value.trim() || null;
        const explanation = dom.explanationInput.value;
        const options = {};
        let correctAnswer = null;
        const optionRows = dom.optionsModalContainer.querySelectorAll('.option-row');
        let validationIssues = [];

        if (isNaN(qNumber) || qNumber <= 0) validationIssues.push('Question Number must be a positive integer.');
        if (!qText.trim()) validationIssues.push('Question Text is required.');
        if (optionRows.length < 2) validationIssues.push('At least two options are required.');
        
        const optionKeys = new Set();
        optionRows.forEach((row, index) => {
            const key = row.querySelector('.option-key').value.trim();
            const value = row.querySelector('.option-value').value; 
            if (!key) validationIssues.push(`Option ${index + 1} key is required.`);
            else if (optionKeys.has(key)) validationIssues.push(`Option key "${key}" is duplicated.`);
            else optionKeys.add(key);
            if (!value.trim() && key) validationIssues.push(`Option "${key}" value is required.`);
            if(key) options[key] = value; 
            if (row.querySelector('.option-radio').checked && key) correctAnswer = key;
        });

        if (!correctAnswer && optionRows.length > 0 && Object.keys(options).length > 0) {
            const firstValidOptionKey = optionRows[0]?.querySelector('.option-key')?.value.trim();
            if(firstValidOptionKey && options.hasOwnProperty(firstValidOptionKey)) { 
                correctAnswer = firstValidOptionKey; 
                optionRows[0].querySelector('.option-radio').checked = true; 
                showToast('Auto-selected first option as correct.', 'warning'); 
            } else { 
                validationIssues.push('A correct answer must be selected (and its key must be valid).'); 
            }
        } else if (optionRows.length > 0 && !correctAnswer) { 
            validationIssues.push('A correct answer must be selected.'); 
        }
        
        // Check for duplicate question_number, excluding the current question if editing
        const otherQuestions = questionsData.filter((q, i) => i !== currentEditIndex);
        if (qNumber && otherQuestions.some(q => q.question_number === qNumber)) { 
            validationIssues.push(`Question Number ${qNumber} is already in use. Please use a unique number.`); 
        }

        if (validationIssues.length > 0) { showToast(validationIssues.join('<br>'), 'error', 5000); return; }

        const questionObject = { 
            question_number: qNumber, 
            question_text: qText, 
            options: options, 
            correct_answer: correctAnswer,
            subject: subject,
            topic: topic,
            explanation: explanation || null, // Ensure explanation is null if empty
            difficulty: difficulty,
            section_id: sectionId
        };
        Object.keys(questionObject).forEach(key => {
             if (questionObject[key] === "" && ['subject', 'topic', 'explanation', 'difficulty', 'section_id'].includes(key)) {
                questionObject[key] = null; // Convert empty strings for optional fields to null for cleaner JSON
            }
        });


        if (currentEditIndex > -1 && currentEditIndex < questionsData.length) { 
            questionsData[currentEditIndex] = questionObject; 
        } else { 
            questionsData.push(questionObject); 
        }
        
        // performValidation will sort, render, and update count
        performValidation('form'); 
        questionModalInstance.hide();
        showToast(`Question ${qNumber} saved successfully!`, 'success');
    };
    
    const renderPreview = () => {
        dom.previewContainer.innerHTML = ''; 
        dom.noPreviewContent.style.display = 'none';
        dom.previewAlert.style.display = 'none';
        
        if (!questionsData || questionsData.length === 0) { 
            dom.noPreviewContent.style.display = 'block'; 
            return; 
        }
        
        try { 
            validateJsonStructure(JSON.stringify(questionsData)); // Quick check
            dom.previewAlert.style.display = 'none'; 
        } catch (error) { 
            dom.previewAlertText.innerHTML = `Preview Error: Current JSON data is invalid. Please fix errors before previewing.<br><small>${error.message.replace(/\n/g, '<br>')}</small>`; 
            dom.previewAlert.style.display = 'block'; 
            return; 
        }

        // questionsData should be sorted by performValidation
        questionsData.forEach(q => {
            const previewQuestionDiv = document.createElement('div');
            previewQuestionDiv.className = 'preview-question';
            let questionHeader = `<div class="preview-question-header">
                                    <span class="preview-question-number">Question ${q.question_number}</span>
                                    <div class="preview-header-details">`;
            if(q.subject) questionHeader += `<span class="badge bg-info-subtle text-info-emphasis me-1">${sanitizeForHTMLAttribute(q.subject)}</span>`;
            if(q.topic) questionHeader += `<span class="badge bg-secondary-subtle text-secondary-emphasis me-1">${sanitizeForHTMLAttribute(q.topic)}</span>`;
            if(q.section_id) questionHeader += `<span class="badge bg-primary-subtle text-primary-emphasis me-1">${sanitizeForHTMLAttribute(q.section_id)}</span>`;
            if(q.difficulty) questionHeader += `<span class="badge bg-warning-subtle text-warning-emphasis">${sanitizeForHTMLAttribute(q.difficulty)}</span>`;
            else questionHeader += `<span class="badge bg-light text-muted">Difficulty: N/A</span>`;
            questionHeader += `</div></div>`;
            previewQuestionDiv.innerHTML += questionHeader;

            const questionTextEl = document.createElement('div');
            questionTextEl.className = 'preview-question-text mb-3';
            renderRichText(q.question_text, questionTextEl);
            previewQuestionDiv.appendChild(questionTextEl);

            if (q.options && typeof q.options === 'object') {
                const optionsDiv = document.createElement('div');
                optionsDiv.className = 'preview-options-list';
                for (const key in q.options) {
                    const optionDiv = document.createElement('div');
                    optionDiv.className = 'preview-option';
                    if (key === q.correct_answer) optionDiv.classList.add('correct');
                    const optionKeyEl = document.createElement('span');
                    optionKeyEl.className = 'preview-option-key';
                    optionKeyEl.textContent = `${key.toUpperCase()})`;
                    optionDiv.appendChild(optionKeyEl);
                    const optionValueEl = document.createElement('div');
                    optionValueEl.className = 'preview-option-value';
                    renderRichText(q.options[key], optionValueEl);
                    optionDiv.appendChild(optionValueEl);
                    optionsDiv.appendChild(optionDiv);
                }
                previewQuestionDiv.appendChild(optionsDiv);
            }
            if (q.explanation && q.explanation.trim() !== "") {
                const explanationDiv = document.createElement('div');
                explanationDiv.className = 'preview-explanation';
                explanationDiv.innerHTML = `<p class="mb-1"><strong>Explanation:</strong></p>`;
                const explanationTextEl = document.createElement('div');
                explanationTextEl.className = 'preview-explanation-text';
                renderRichText(q.explanation, explanationTextEl);
                explanationDiv.appendChild(explanationTextEl);
                previewQuestionDiv.appendChild(explanationDiv);
            }
            dom.previewContainer.appendChild(previewQuestionDiv);
        });
    };

    const syncFormToJsonEditor = () => { 
        if (!performValidation('form')) { showToast('Form data is invalid. Cannot sync to JSON editor.', 'error', 5000); return; }
        try { 
            if(editorInstance) editorInstance.setValue(JSON.stringify(questionsData, null, 2)); 
            showToast('Form data synced to JSON Editor!', 'success'); 
            dom.jsonEditorStatus.style.display = 'none'; 
        } 
        catch (error) { showToast(`Error syncing to JSON Editor: ${error.message}`, 'error'); }
    };

    const syncJsonToFormEditor = () => { 
        if (!editorInstance) { showToast('JSON Editor not initialized.', 'error'); return; }
        showLoading("Syncing...", "Parsing JSON from editor...");
        setTimeout(() => { 
            try { 
                const jsonDataFromEditor = editorInstance.getValue();
                // validateJsonStructure will throw if invalid, also updates questionsData if valid
                const parsedData = validateJsonStructure(jsonDataFromEditor); 
                questionsData = parsedData; 
                // Now call performValidation which will sort, update UI, and potentially re-format editor
                performValidation('json_editor'); // This will use the (now updated) questionsData
                showToast('JSON synced to Form Editor!', 'success'); 
                dom.validationErrorMessage.style.display = 'none';
            } 
            catch (error) { 
                showToast(`Error syncing from JSON: ${error.message.split('\n')[0]}...`, 'error', 5000); 
                dom.jsonStatus.className = 'status-badge status-invalid'; 
                dom.jsonStatus.innerHTML = '<i class="fas fa-times-circle"></i> Invalid'; 
                dom.validationErrorMessage.style.display = 'block'; 
                dom.validationErrorText.innerHTML = `JSON Editor Sync Error: ${error.message.replace(/\n/g, '<br>')}`; 
            } 
            finally { hideLoading(); }
        }, 100);
    };

    const handleImport = () => {
        const importMethod = document.querySelector('input[name="importMethod"]:checked').value;
        let jsonString = '';
        if (importMethod === 'file') {
            const file = dom.fileInput.files[0]; 
            if (!file) { showToast('Please select a JSON file to import.', 'warning'); return; }
            if (!file.name.endsWith('.json') && file.type !== 'application/json') { 
                showToast('Invalid file type. Please select a .json file.', 'warning'); return; 
            }
            
            showLoading("Importing file...", "Reading and parsing file...");
            const reader = new FileReader();
            reader.onload = (e) => { 
                try { 
                    jsonString = e.target.result; 
                    processImportedJson(jsonString); 
                } catch (error) { 
                    showToast(`Error reading file content: ${error.message}`, 'error');
                } finally { 
                    hideLoading(); 
                }
            };
            reader.onerror = () => { showToast('Error occurred while reading the file.', 'error'); hideLoading(); };
            reader.readAsText(file);
        } else { 
            jsonString = dom.pasteJsonTextarea.value; 
            if (!jsonString.trim()) { showToast('Please paste JSON content to import.', 'warning'); return; }
            showLoading("Importing text...", "Parsing JSON...");
            setTimeout(() => { 
                try { 
                    processImportedJson(jsonString); 
                } finally { 
                    hideLoading(); 
                } 
            }, 100);
        }
    };
    const processImportedJson = (jsonStr) => {
        try { 
            // validateJsonStructure will throw, no need to assign to questionsData here yet
            const parsedData = validateJsonStructure(jsonStr); 
            questionsData = parsedData; // Now assign
            
            performValidation('form'); // This will sort, update UI, and sync to editor
            
            showToast('JSON imported & validated successfully!', 'success'); 
            importModalInstance.hide(); 
            dom.pasteJsonTextarea.value = ''; 
            dom.dropzoneFileName.textContent = ''; 
            dom.fileInput.value = ''; 
            dom.formEditorTab.show(); 
        } 
        catch (error) { 
            showToast(`Import Error: ${error.message.split('\n')[0]}... (See console for details or validation panel if shown)`, 'error', 7000); 
            console.error("Full Import Error:", error);
            dom.jsonStatus.className = 'status-badge status-invalid';
            dom.jsonStatus.innerHTML = '<i class="fas fa-times-circle"></i> Invalid Import';
            dom.validationErrorMessage.style.display = 'block';
            dom.validationErrorText.innerHTML = `Import Failed: ${error.message.replace(/\n/g, '<br>')}`;
        }
    };
    const handleExport = () => {
        if (!performValidation('form')) { 
            if (!confirm("Current data has validation issues. Export anyway?")) {
                exportModalInstance.hide();
                return;
            }
            showToast('Exporting data with validation issues.', 'warning');
        }
        if (questionsData.length === 0) { showToast('No questions to export.', 'warning'); exportModalInstance.hide(); return; }
        
        const fileName = dom.fileNameInput.value || 'examify_questions.json';
        const prettyPrint = dom.formatJsonCheckbox.checked;
        // questionsData is already sorted by performValidation
        const jsonString = JSON.stringify(questionsData, null, prettyPrint ? 2 : undefined);
        
        const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); 
        a.href = url; 
        a.download = fileName.endsWith('.json') ? fileName : `${fileName}.json`;
        document.body.appendChild(a); 
        a.click(); 
        document.body.removeChild(a); 
        URL.revokeObjectURL(url);
        showToast('JSON data exported successfully!', 'success'); 
        exportModalInstance.hide();
    };
    
    const populateTemplateCategories = () => { renderTemplatesForCategory(dom.templateCategorySelect.value); };
    const renderTemplatesForCategory = (categoryKey) => {
        dom.templatesListDiv.innerHTML = ''; 
        dom.templatesLoading.style.display = 'block';
        
        setTimeout(() => {
            const categoryTemplates = TEMPLATES[categoryKey];
            if (categoryTemplates && categoryTemplates.length > 0) { 
                categoryTemplates.forEach(template => { 
                    const btn = document.createElement('button'); 
                    btn.className = 'btn btn-outline-secondary btn-sm template-btn d-flex align-items-center'; 
                    btn.innerHTML = `<i class="fas ${template.icon || 'fa-file-alt'} fa-fw"></i> <span class="ms-2 flex-grow-1">${sanitizeForHTMLAttribute(template.name)}</span>`; 
                    btn.onclick = () => loadTemplate(template.data, template.name); 
                    dom.templatesListDiv.appendChild(btn); 
                });
            } else {
                dom.templatesListDiv.innerHTML = '<p class="text-muted small text-center">No templates in this category.</p>';
            }
            dom.templatesLoading.style.display = 'none';
        }, 50);
    };

    const loadTemplate = (templateDataArray, templateName) => {
        const deepClonedTemplateData = JSON.parse(JSON.stringify(templateDataArray));

        if (questionsData.length > 0) {
            const userChoice = confirm(`Load template "${templateName}"?\n\nOK = Replace current questions\nCancel = Append to current questions`);
            if (userChoice) { 
                questionsData = deepClonedTemplateData;
                showToast(`Template "${templateName}" loaded, replacing current content.`, 'info');
            } else { 
                let nextQNum = questionsData.length > 0 
                    ? Math.max(0, ...questionsData.map(q => q.question_number || 0).filter(n => typeof n === 'number' && isFinite(n))) + 1 
                    : 1;
                deepClonedTemplateData.forEach(tQ => { 
                    tQ.question_number = nextQNum++; 
                    questionsData.push(tQ); 
                });
                showToast(`Template "${templateName}" appended to existing questions.`, 'info');
            }
        } else { 
            questionsData = deepClonedTemplateData;
            showToast(`Template "${templateName}" loaded.`, 'info');
        }
        
        performValidation('form'); // Will sort, render, update count, and sync to editor
        dom.formEditorTab.show(); 
    };
    
    function duplicateQuestion(indexToDuplicate) {
        if (indexToDuplicate < 0 || indexToDuplicate >= questionsData.length) {
            showToast("Invalid question index for duplication.", "error");
            return;
        }
        const originalQuestion = questionsData[indexToDuplicate];
        const duplicatedQuestion = JSON.parse(JSON.stringify(originalQuestion)); 

        const maxQNum = questionsData.length > 0 
            ? Math.max(0, ...questionsData.map(q => q.question_number || 0).filter(n => typeof n === 'number' && isFinite(n)))
            : 0;
        duplicatedQuestion.question_number = maxQNum + 1;
        
        duplicatedQuestion.question_text = `(Copy of Q#${originalQuestion.question_number}) ${originalQuestion.question_text}`;

        questionsData.push(duplicatedQuestion);
        performValidation('form'); // This will sort and update UI
        showToast(`Question ${originalQuestion.question_number} duplicated as Q#${duplicatedQuestion.question_number}.`, 'success');
    }

    const setupEventListeners = () => { 
        dom.sidebarToggle.addEventListener('click', () => { 
            dom.sidebar.classList.toggle('collapsed'); 
            dom.mainContent.classList.toggle('expanded'); 
            dom.sidebarToggle.classList.toggle('collapsed'); 
            if (editorInstance) setTimeout(() => editorInstance.refresh(), 300);
        });
        dom.addQuestionBtn.addEventListener('click', () => { clearQuestionModalForm(); questionModalInstance.show(); });
        dom.importBtnTrigger.addEventListener('click', () => importModalInstance.show());
        dom.exportBtnTrigger.addEventListener('click', () => {
            const subjects = new Set(questionsData.map(q => q.subject).filter(s => s));
            if (subjects.size === 1) {
                const subjectName = Array.from(subjects)[0].replace(/[^a-z0-9_]/gi, '_').toLowerCase();
                dom.fileNameInput.value = `${subjectName}_questions.json`;
            } else {
                dom.fileNameInput.value = 'examify_questions.json';
            }
            exportModalInstance.show();
        });
        dom.addOptionModalBtn.addEventListener('click', () => { const idx = dom.optionsModalContainer.querySelectorAll('.option-row').length; renderOptionInModal(String.fromCharCode(97 + idx), '', (idx === 0 && dom.optionsModalContainer.querySelectorAll('.option-row input[type=radio]:checked').length === 0), idx); });
        dom.optionsModalContainer.addEventListener('click', (e) => { 
            const removeButton = e.target.closest('.remove-option-btn');
            if (removeButton) {
                if (dom.optionsModalContainer.querySelectorAll('.option-row').length <= 2) {
                    showToast("Minimum 2 options required.", "warning");
                    return;
                }
                removeButton.closest('.option-row').remove(); 
            }
        });
        dom.saveQuestionBtn.addEventListener('click', saveQuestionFromModal);
        dom.validateFormBtn.addEventListener('click', () => performValidation('form'));
        dom.syncToJsonBtn.addEventListener('click', syncFormToJsonEditor);
        dom.questionsAccordion.addEventListener('click', (e) => { 
            const editBtn = e.target.closest('.edit-question-btn'); 
            const deleteBtn = e.target.closest('.delete-question-btn'); 
            const duplicateBtn = e.target.closest('.duplicate-question-btn');
            if (editBtn) { const idx = parseInt(editBtn.dataset.index, 10); if (idx >= 0 && idx < questionsData.length) loadQuestionIntoModalForm(questionsData[idx], idx); } 
            else if (deleteBtn) { 
                const idx = parseInt(deleteBtn.dataset.index, 10); 
                const qNumToDelete = questionsData[idx]?.question_number || `question at index ${idx}`;
                if (confirm(`Are you sure you want to delete Question ${qNumToDelete}? This action cannot be undone.`)) { 
                    questionsData.splice(idx, 1); 
                    performValidation('form'); // Re-validate which will re-render and update counts
                    showToast(`Question ${qNumToDelete} deleted.`, 'info');
                }
            } else if (duplicateBtn) {
                const idx = parseInt(duplicateBtn.dataset.index, 10);
                duplicateQuestion(idx);
            }
        });
        dom.validateJsonEditorBtn.addEventListener('click', () => performValidation('json_editor'));
        dom.syncToFormBtn.addEventListener('click', syncJsonToFormEditor);
        dom.refreshPreviewBtn.addEventListener('click', renderPreview);
        
        document.getElementById('json-tab').addEventListener('shown.bs.tab', () => { if (editorInstance) editorInstance.refresh(); });
        document.getElementById('preview-tab').addEventListener('shown.bs.tab', () => renderPreview());
        
        dom.importFileRadio.addEventListener('change', () => { dom.importFileSection.style.display = 'block'; dom.importPasteSection.style.display = 'none'; });
        dom.importPasteRadio.addEventListener('change', () => { dom.importFileSection.style.display = 'none'; dom.importPasteSection.style.display = 'block'; });
        dom.dropzoneArea.addEventListener('click', () => dom.fileInput.click());
        dom.fileInput.addEventListener('change', (e) => { if (e.target.files.length > 0) dom.dropzoneFileName.textContent = `Selected: ${e.target.files[0].name}`; else dom.dropzoneFileName.textContent = ''; });
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => dom.dropzoneArea.addEventListener(evt, (e) => { e.preventDefault(); e.stopPropagation(); }, false));
        ['dragenter', 'dragover'].forEach(evt => dom.dropzoneArea.addEventListener(evt, () => dom.dropzoneArea.classList.add('dragover'), false));
        ['dragleave', 'drop'].forEach(evt => dom.dropzoneArea.addEventListener(evt, () => dom.dropzoneArea.classList.remove('dragover'), false));
        dom.dropzoneArea.addEventListener('drop', (e) => { dom.fileInput.files = e.dataTransfer.files; if (dom.fileInput.files.length > 0) dom.dropzoneFileName.textContent = `Selected: ${dom.fileInput.files[0].name}`; }, false);
        
        dom.importJsonBtn.addEventListener('click', handleImport);
        dom.confirmExportBtn.addEventListener('click', handleExport);
        dom.templateCategorySelect.addEventListener('change', (e) => renderTemplatesForCategory(e.target.value));
        dom.validateGlobalBtn.addEventListener('click', () => { const activeTab = document.querySelector('#mainTabs .nav-link.active').id; if (activeTab === 'json-tab') performValidation('json_editor'); else performValidation('form'); });
        
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(el => new bootstrap.Tooltip(el, { delay: { show: 500, hide: 100 } }));
    };

    const init = () => {
        questionModalInstance = new bootstrap.Modal(dom.questionModal);
        importModalInstance = new bootstrap.Modal(dom.importModal);
        exportModalInstance = new bootstrap.Modal(dom.exportModal);
        loadingModalInstance = new bootstrap.Modal(dom.loadingModal, { keyboard: false, backdrop: 'static' });
        helpModalInstance = new bootstrap.Modal(dom.helpModal);

        if (typeof Prism !== 'undefined' && Prism.plugins.autoloader) {
            Prism.plugins.autoloader.languages_path = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/';
        }

        // Set initial questionsData first
        const initialExampleData = JSON.parse(JSON.stringify(TEMPLATES.basic[0].data));
        questionsData = initialExampleData;

        // Initialize CodeMirror (it will try to set its own value from questionsData)
        initCodeMirror();
        
        setupEventListeners();
        populateTemplateCategories();

        // performValidation('form') will use questionsData and update UI + potentially editor
        performValidation('form');

        showToast('Examify JSON Editor Loaded! Ready to create.', 'success');
        if (window.innerWidth <= 768 && !dom.sidebar.classList.contains('collapsed')) {
            dom.sidebarToggle.click();
        }
    };
    
    init();
});