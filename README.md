An AI-powered coding assistant built with LangGraph.
It works like a multi-agent development team that can take a natural language request and transform it into a complete, working project — file by file — using real developer workflows.

🏗️ Architecture

Planner Agent – Analyzes your request and generates a detailed project plan.

Architect Agent – Breaks down the plan into specific engineering tasks with explicit context for each file.

Coder Agent – Implements each task, writes directly into files, and uses available tools like a real developer.

Coder Agent Architecture

🚀 Getting Started

Prerequisites

Make sure you have uv installed, follow the instructions here to install it.

Ensure that you have created a groq account and have your API key ready. Create an API key here.

⚙️ Instsllstion and Startup

Create a virtual environment using: uv venv and activate it using source .venv/bin/activate

Install the dependencies using: uv pip install -r pyproject.toml

Create a .env file and add the variables and their respective values mentioned in the .sample_env file

Now that we are done with all the set-up & installation steps we can start the application using the following command:

  python main.py
  
🧪 Example Prompts

Create a to-do list application using html, css, and javascript.

Create a simple calculator web application.

Create a simple blog API in FastAPI with a SQLite database.# AI-software-engineer
