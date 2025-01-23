async function checkPlagiarism() {
    const textToCheck = document.getElementById('inputText').value;
    const proxyUrl = 'https://simple-proxy.mayor.workers.dev/';
    const url = 'https://papersowl.com/plagiarism-checker-send-data';
    const checkButton = document.getElementById('checkButton');
    const pasteButton = document.getElementById('pasteButton');
    const clearButton = document.getElementById('clearButton');
    const inputText = document.getElementById('inputText');
    const resultDiv = document.getElementById('result');

    // Reset the result section
    resultDiv.innerHTML = '';

    // Check if input text is empty
    if (!textToCheck.trim()) {
        displayError({
            message: 'Input text cannot be empty. Please enter some text to check.'
        });
        return;
    }

    // Show loading bar
    document.getElementById('loadingBar').style.display = 'block';

    // Disable buttons and input
    checkButton.classList.add('button--loading');
    checkButton.disabled = true;
    pasteButton.disabled = true;
    clearButton.disabled = true;
    inputText.disabled = true;

    // Cookies for the request
    const cookies = {
        PHPSESSID: 'qjc72e3vvacbtn4jd1af1k5qn1',
        first_interaction_user: '{"referrer":"https://www.google.com/","internal_url":"/free-plagiarism-checker","utm_source":null,"utm_medium":null,"utm_campaign":null,"utm_content":null,"utm_term":null,"gclid":null,"msclkid":null,"adgroupid":null,"targetid":null,"appsflyer_id":null,"appsflyer_cuid":null,"cta_btn":null}',
        first_interaction_order: '{"referrer":"https://www.google.com/","internal_url":"/free-plagiarism-checker","utm_source":null,"utm_medium":null,"utm_campaign":null,"utm_content":null,"utm_term":null,"gclid":null,"msclkid":null,"adgroupid":null,"targetid":null,"appsflyer_id":null,"appsflyer_cuid":null,"cta_btn":null}',
        affiliate_user: 'a:3:{s:9:"affiliate";s:9:"papersowl";s:6:"medium";s:9:"papersowl";s:8:"campaign";s:9:"papersowl";}',
        // ... (other cookies remain unchanged)
    };

    // Headers for the request
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; Win64; x64; rv:100.0) Gecko/20100101 Firefox/100.0',
        'Accept': '*/*',
        'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        'Origin': 'https://papersowl.com',
        'Dnt': '1',
        'Connection': 'close',
        'Cookies': Object.entries(cookies).map(([key, value]) => `${key}=${value}`).join('; ')
    };

    // Prepare data for the request
    const data = new URLSearchParams({
        is_free: 'false',
        plagchecker_locale: 'en',
        product_paper_type: '1',
        title: '',
        text: textToCheck
    });

    try {
        const response = await fetch(`${proxyUrl}?destination=${url}`, {
            method: 'POST',
            headers: headers,
            body: data
        });

        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }

        const result = await response.json();
        displayResult(result, textToCheck);
    } catch (error) {
        console.error('Error:', error);
        displayError({
            message: error instanceof TypeError ? 'Network error. Please check your internet connection.' : error.message
        });
    } finally {
        // Reset the UI state
        checkButton.classList.remove('button--loading');
        checkButton.disabled = false;
        pasteButton.disabled = false;
        clearButton.disabled = false;
        inputText.disabled = false;
        document.getElementById('loadingBar').style.display = 'none';
    }
}

function displayResult(result, text) {
    const resultDiv = document.getElementById('result');
    resultDiv.style.display = 'block'; // Make result section visible
    resultDiv.innerHTML = `<h2>Results</h2>
        <p><strong>Word count:</strong> ${result.words_count}</p>
        <p><strong>Turnitin index:</strong> ${100 - parseFloat(result.percent)}%</p>
        <p><strong>Matches:</strong></p>
        <div id="matches" class="match-container"></div>`;
    
    const matchesDiv = document.getElementById('matches');
    result.matches.forEach((match, index) => {
        const matchDiv = document.createElement('div');
        matchDiv.classList.add('match');
        matchDiv.innerHTML = `<p><strong>URL:</strong> <a href="${match.url}" target="_blank">${match.url}</a></p>
            <p><strong>Percent:</strong> ${match.percent}%</p>
            <p><strong>Highlighted Text:</strong></p>
            <pre>${visualizeHighlights(text, match.highlight)}</pre>`;
        matchesDiv.appendChild(matchDiv);
    });
}

function visualizeHighlights(text, highlights) {
    let highlightedText = text;
    highlights.forEach(([start, end], index) => {
        const color = getHighlightColor(index);
        // Wrap the highlighted text with a span that has a background color (Lot of BUG - Need to be fixed)
        highlightedText = `${highlightedText.slice(0, start)}<span style="background-color: ${color};">${highlightedText.slice(start, end + 1)}</span>${highlightedText.slice(end + 1)}`;
    });

    // Use a temporary DOM element to escape HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = highlightedText; // This will escape HTML
    return tempDiv.innerHTML; // Return the escaped HTML
}

function getHighlightColor(index) {
    const colors = ['lightgreen', 'yellow', 'orange', 'red'];
    return colors[index % colors.length];
}

function displayError(error) {
    const errorModal = document.getElementById('errorModal');
    const errorText = document.getElementById('errorText');
    errorText.innerHTML = `<p>${error.message || 'An unexpected error occurred. Please try again.'}</p>`;
    errorModal.style.display = 'flex'; // Show the modal
}

// Close modal function
function closeModal() {
    const errorModal = document.getElementById('errorModal');
    errorModal.style.display = 'none';
}

// Clear text area function
function clearTextArea() {
    document.getElementById('inputText').value = '';
}

// Add an event listener to the file upload input
document.getElementById('fileUpload').addEventListener('change', function () {
    const file = this.files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
        document.getElementById('inputText').value = e.target.result;
    };
    reader.readAsText(file);
});

// Add event listener to paste button
document.getElementById('pasteButton').addEventListener('click', function () {
    navigator.clipboard.readText().then(text => {
        document.getElementById('inputText').value = text;
    }).catch(err => {
        displayError({
            message: 'Failed to read from clipboard. Please try again.'
        });
    });
});

// Add event listener to generate PDF button
document.getElementById('generatePDF').addEventListener('click', function () {
    const doc = new jsPDF();
    const resultContent = document.getElementById('result').innerHTML;
    doc.fromHTML(resultContent, 15, 15, {
        'width': 170
    });
    doc.save('PlagiarismReport.pdf');
});
