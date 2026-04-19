"""Core views — renders the portfolio page with all resume data."""
from django.shortcuts import render


def index(request):
    """Render the single-page driving portfolio."""
    context = {
        'name': 'Dhyey V. Pithadia',
        'title': 'Computer Engineering Student & AI/ML Enthusiast',
        'summary': 'Computer Engineering student with foundational knowledge in machine learning, NLP, and web development. Experienced in working on AI-based projects and learning modern tools like LLM fine-tuning and FastAPI. Looking for opportunities to grow and contribute as a fresher.',
        'email': 'dhyeypithadia@gmail.com',
        'phone': '+91 9054470736',
        'github': 'https://github.com/DHYEY3559',
        'linkedin': 'https://linkedin.com/in/dhyey-pithadia',

        # Use these for the HUD or quick dashboard
        'hud_stats': [
            {'label': 'Location', 'value': 'Gujarat, India'},
            {'label': 'Target', 'value': 'Fresher Roles'},
            {'label': 'Fuel', 'value': '100%'},
        ],

        'education': [
            {
                'institution': 'V.V.P. Engineering College',
                'degree': 'B.E. in Computer Engineering',
                'score': 'CGPA: 8.57',
                'date': '2023-Present'
            },
            {
                'institution': 'Indian Institute of Technology Madras',
                'degree': 'B.S. in Data Science',
                'score': 'CGPA: 6.06',
                'date': '2023-Present'
            },
            {
                'institution': 'Higher Secondary (Class XII)',
                'degree': 'GSHEB',
                'score': '53%',
                'date': '2022-2023'
            }
        ],

        'projects': [
            {
                'title': 'LLM Code Deployment Agent',
                'date': '2025',
                'description': 'Built a FastAPI server that accepts a project brief via a secure API, uses Gemini to generate web app code, auto creates a GitHub repository with MIT license via GitHub CLI, enables GitHub Pages, and notifies an evaluation server on completion; deployed on Render.com.',
                'github': 'https://github.com/DHYEY3559/LLM-Deployer',
                'tech': ['FastAPI', 'Gemini', 'GitHub CLI', 'Render.com'],
                'color': 'cyan'
            },
            {
                'title': 'SMS-Based AI Assistant',
                'date': '2026',
                'description': 'Built a Flask server that receives SMS messages via TextBee, forwards them to an LLM (Mistral 24B via OpenRouter), and replies back over SMS — enabling AI access for users with no internet connection using only basic SMS functionality.',
                'tech': ['Flask', 'TextBee', 'Mistral 24B', 'OpenRouter'],
                'color': 'emerald'
            },
            {
                'title': 'Speech and Language Processing System',
                'date': '2024',
                'description': 'Built a web app with STT and TTS capabilities, hand detection for visual-to-speech conversion, and a secure login system using HTML, CSS, and Bootstrap.',
                'github': 'https://github.com/DHYEY3559/CVM-Project',
                'tech': ['HTML', 'CSS', 'Bootstrap', 'NLP', 'STT/TTS'],
                'color': 'rose'
            },
            {
                'title': 'LLaMA 3.2 Fine-Tuning (Gujarati)',
                'date': '2025',
                'description': 'Fine-tuned LLaMA 3.2 using LoRA and Hugging Face Transformers on the AI4Bharat Samanantar dataset (20,000 parallel Gujarati-English pairs) in Alpaca format for translation and QA; deployed locally via Ollama for evaluation.',
                'github': 'https://huggingface.co/Dhyey3559/gujarati-finetune-llama3b',
                'tech': ['LoRA', 'Transformers', 'Ollama', 'LLaMA 3.2'],
                'color': 'violet'
            },
            {
                'title': 'LLaMA 3.2 1B 4-bit Quantized',
                'date': '2026',
                'description': 'Fine-tuned LLaMA 3.2 1B using QLoRA (4-bit NF4) on 200,000 bidirectional Gujarati-English pairs from AI4Bharat Samanantar via Unsloth on Colab T4; merged LoRA weights and pushed to HuggingFace.',
                'github': 'https://huggingface.co/Dhyey3559/llama32-1b-gujarati-lora',
                'tech': ['QLoRA', 'Unsloth', 'Colab T4'],
                'color': 'violet'
            },
            {
                'title': 'Gemma 4 E2B Fine-Tuning',
                'date': '2026 — In Progress',
                'description': 'Currently fine-tuning Google\'s Gemma 4 E2B (2.3B effective parameters, multimodal) using QLoRA via Unsloth on 200,000 bidirectional Samanantar pairs; attached LoRA adapters (r=16) with only 0.60% trainable parameters.',
                'tech': ['Gemma 4 E2B', 'QLoRA', 'Unsloth'],
                'color': 'amber'
            }
        ],

        'skills': [
            'FastAPI', 'Django', 'Flask', 'LLM Fine-Tuning (LoRA)', 
            'Hugging Face Transformers & PEFT', 'Unsloth', 'HTML', 'Web Design', 
            'Problem-Solving', 'Communication', 'Java', 'JDBC'
        ],

        'certifications': [
            {
                'title': 'Foundational Course — IIT Madras',
                'date': '2023-2025',
                'description': 'Completed Mathematics, Statistics, Computational Thinking, and English; scored 71% Elite Ranking.'
            },
            {
                'title': 'Python for Data Science — NPTEL',
                'date': '2025',
                'description': 'Earned Elite Ranking with 71%; mastered core Python skills in data types, loops, functions, and data analysis.'
            }
        ],
        
        'extracurricular': {
            'title': 'Table Tennis Player — Captain, VVP Table Tennis Team',
            'description': 'Developed leadership, teamwork, and competitive mindset through regular practice and tournament participation'
        }
    }
    return render(request, 'core/index.html', context)
