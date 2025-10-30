# 📄 Local LLM PDF Structured Data Extractor

This project demonstrates how to use a powerful, open-source Large Language Model (**Mistral 7B**) running entirely locally via **Ollama** to perform **structured data extraction** from PDF documents — specifically targeting **medical reports**.

The script extracts the **Diagnosis**, **Results**, and **Findings** sections and outputs a clean, reliable **JSON object** based on a predefined schema.

---

## 🚀 Prerequisites

Before you begin, make sure you have the following:

- **Python 3.8+** – Required to run the main extraction script.  
- **Ollama** – The local runtime environment for the LLM.  
- **Mistral 7B Model** – The specific LLM used for the extraction task.  
- **A PDF file** – The document you wish to process (e.g., `Temp1.pdf`).

---

## ⚙️ Step 1: Set Up Ollama and Mistral 7B

You need to install **Ollama** and download the **Mistral 7B** model before running the Python script.

### 1.1 Install Ollama

Follow the instructions for your operating system:

| OS | Command / Link |
|----|----------------|
| **macOS** | Download the application from the [Ollama website](https://ollama.com). |
| **Windows** | Download the Windows installer from the [Ollama website](https://ollama.com). |
| **Linux (Recommended)** | Open your terminal and run:  `curl -fsSL https://ollama.com/install.sh | sh` |
### If this doesn't work use sudo snap install ollama

### 1.2 Download the Mistral Model

Once Ollama is installed, download the Mistral 7B model using:

`ollama run mistral`

The first time this runs, it will download the model (~4.1 GB).

When the model loads and you see the `>>>` prompt, type `/bye` and press **Enter** to exit.  
The Ollama service will remain running in the background.

---

## 🐍 Step 2: Set Up the Python Environment

### 2.1 Project Structure

Make sure your directory looks like this:

/extraction-project
├── pdf_extractor.py
└── Temp1.pdf # Your input PDF file

### 2.2 Install Python Dependencies

The script uses **PyMuPDF** for reading PDF text and **requests** for communicating with the Ollama API.

Run the following command in your project directory:

`pip install PyMuPDF requests`

---

## 🏃 Step 3: Run the Extraction

With Ollama running and the Mistral model ready, execute the Python script:

`python pdf_extractor.py`

---

## 🧾 Expected Output

The script will print status updates as it extracts text and communicates with Ollama.  
If successful, it will display the final structured output and save it as `extracted_report.json`.

---

### ✅ **Sample Output**


=======================================================
✅ EXTRACTION SUCCESSFUL:
{
'diagnosis': {
'title': 'PAP DIAGNOSIS:',
'finding': 'ATYPICAL SQUAMOUS CELLS OF UNDETERMINED SIGNIFICANCE (ASC-US)'
},
'findings': {
'title': 'Additional Cytologic Findings',
'specimen_adequacy': 'Satisfactory for evaluation.',
'transformation_zone': 'Endocervical/transformation zone component present'
},
'results': {
'main_title': 'Cytologic and Molecular Results',
'molecular_results': {
'title': 'MOLECULAR RESULTS:',
'high_risk_hpv': 'DETECTED',
'chlamydia_trachomatis': 'not detected',
'neisseria_gonorrhoeae': 'not detected',
'trichomonas_vaginalis': 'not detected'
}
}
}

Output also saved to 'extracted_report.json'


---

## 🧠 Notes

- Make sure the **Ollama service** is running before executing the Python script.  
- The model runs **entirely locally**, ensuring privacy and offline capability.  
- You can easily modify the extraction prompt or schema in `pdf_extractor.py` to target other document types.

---

## 🧩 Tech Stack

- **Python** – Data extraction and automation  
- **PyMuPDF** – PDF parsing  
- **Ollama** – Local LLM runtime  
- **Mistral 7B** – Large Language Model for text understanding  

---
