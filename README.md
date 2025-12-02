# ¥apper (EECS 581 Project 3)

A multi-room chatroom for users.

# Development

1. Clone this repo

   ```sh
   git clone git@github.com:nfahmad/eecs581_project3.git yapper
   ```

2. Start up the FastAPI dev server
 
   ```sh
   cd yapper/backend
   uv run fastapi dev server
   ```

> [!NOTE]
> It is highly recommended to install use [uv](https://github.com/astral-sh/uv) to run the backend server.
> 
> There is still a `requirements.txt` for legacy purposes.
> ```sh
> cd yapper/backend
> 
> python3 -m venv .venv
> source .venv/bin/activate
> pip install -r requirements.txt
> 
> fastapi dev server
> ```

3. Start up the React dev server

   ```sh
   cd yapper/frontend
   npm i        # Install packages
   npm run dev  # Run the development server
   ```

Visit the URL for the frontend to interact with the app.

# Features

1. Create user profiles
2. Chat in different rooms
3. Create new rooms
