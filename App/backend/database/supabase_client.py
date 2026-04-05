# TODO: Gonna change to async client instead to help future scalling later on

# this has the set up for supabase
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# load
load_dotenv()

# client set up
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)
