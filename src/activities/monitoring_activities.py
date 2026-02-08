from temporalio import activity
from typing import List
import re

@activity.defn
async def news_search_activity(params: dict) -> List[str]:
    """
    MVP: повертаємо 2-3 URL-и фейково.
    Потім заміниш на справжній news search (SerpAPI, Bing, GNews, etc).
    """
    company = params.get("company", "")
    query = params.get("query", "")
    top_n = int(params.get("top_n", 3))

    # тимчасово: якщо юзер вставляє URL у query — витягнемо його
    urls = re.findall(r"https?://\S+", query)

    if urls:
        return urls[:top_n]

    # dummy fallback
    return [
        "https://example.com/article-1",
        "https://example.com/article-2",
        "https://example.com/article-3",
    ][:top_n]
