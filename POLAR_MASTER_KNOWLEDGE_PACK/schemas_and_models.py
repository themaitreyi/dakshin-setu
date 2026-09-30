"""
POLAR SCIENCE DATA MODELS & SCHEMAS
Compatible with FastAPI, Pydantic v2, and SQLAlchemy ORM.
Designed for both SQLite (Local dev) and PostgreSQL (Production).
"""

from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field, HttpUrl
from sqlalchemy import Column, String, Integer, Float, Text, Boolean, JSON, ForeignKey, create_engine
from sqlalchemy.orm import DeclarativeBase, relationship

# =============================================================================
# 1. SQLALCHEMY ORM MODELS (PostgreSQL / SQLite)
# =============================================================================

class Base(DeclarativeBase):
    pass

class Resource(Base):
    """Normalized repository resource storing heterogeneous polar assets."""
    __tablename__ = "resources"

    id = Column(String(64), primary_key=True, index=True)
    title = Column(String(300), nullable=False, index=True)
    resource_type = Column(String(32), nullable=False, index=True)  # report, publication, dataset, photo, video, expedition, activity
    region = Column(String(32), nullable=False, index=True)         # Antarctic, Arctic, Himalaya, Southern Ocean, Multiple
    station = Column(String(64), nullable=True, index=True)          # Maitri, Bharati, Dakshin Gangotri, Himadri, Himansh
    source_owner = Column(String(200), nullable=False)
    source_url = Column(String(500), nullable=False)
    publication_date = Column(String(32), nullable=True)
    description = Column(Text, nullable=False, default="")
    licence = Column(String(300), nullable=False)
    rights_confirmed = Column(Boolean, default=True)
    availability = Column(String(32), default="metadata-only")      # online, offline, restricted, metadata-only
    topics = Column(JSON, default=list)                             # Array of tag strings
    related_ids = Column(JSON, default=list)                        # Connected resource foreign IDs
    verification = Column(String(32), default="curator-reviewed")
    sha256 = Column(String(64), nullable=True)
    filename = Column(String(128), nullable=True)                   # Local storage binary filename
    mime_type = Column(String(64), nullable=True)
    byte_size = Column(Integer, default=0)
    created_at = Column(String(64), nullable=False)
    data = Column(JSON, nullable=False, default=dict)               # Raw preserved metadata dictionary
    chunks = Column(JSON, nullable=False, default=list)             # Array of chunk objects


class OutreachDraft(Base):
    """AI-generated outreach drafts awaiting human curator review."""
    __tablename__ = "drafts"

    id = Column(String(64), primary_key=True)
    title = Column(String(300), nullable=False)
    format = Column(String(32), nullable=False)                     # public-summary, website-article, social-thread, educational-explainer
    target_audience = Column(String(32), nullable=False)            # students, general-public, journalists, educators
    content = Column(Text, nullable=False)
    source_ids = Column(JSON, nullable=False, default=list)
    status = Column(String(32), default="draft")                    # draft, approved, rejected, published
    created_at = Column(String(64), nullable=False)
    data = Column(JSON, nullable=False, default=dict)


class PublicEnquiry(Base):
    """Citizen, educator, or student inquiries submitted to the portal."""
    __tablename__ = "enquiries"

    id = Column(String(64), primary_key=True)
    name = Column(String(120), nullable=False)
    email = Column(String(254), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(String(64), nullable=False)
    data = Column(JSON, nullable=False, default=dict)


# =============================================================================
# 2. PYDANTIC REQUEST & RESPONSE VALIDATION SCHEMAS
# =============================================================================

class ChunkSchema(BaseModel):
    chunk_id: str = Field(description="Unique deterministic ID: {resource_id}_c{index:03d}")
    text: str = Field(min_length=10, max_length=5000)
    page: Optional[int] = Field(default=None, description="Source page number")
    section: Optional[str] = Field(default="Main Text")
    offset: Optional[int] = 0

class ResourceCreateSchema(BaseModel):
    title: str = Field(min_length=3, max_length=300)
    resource_type: Literal["report", "publication", "dataset", "photo", "video", "expedition", "activity"]
    region: Literal["Antarctic", "Arctic", "Himalaya", "Southern Ocean", "Multiple"]
    station: Optional[Literal["Maitri", "Bharati", "Dakshin Gangotri", "Himadri", "Himansh"]] = None
    source_owner: str = Field(min_length=2, max_length=200)
    source_url: HttpUrl
    publication_date: Optional[str] = None
    description: str = Field(default="", max_length=15000)
    licence: str = Field(default="NCPOR Open Data Policy", max_length=300)
    rights_confirmed: bool = True
    availability: Literal["online", "offline", "restricted", "metadata-only"] = "metadata-only"
    topics: List[str] = Field(default_factory=list, max_length=40)
    related_ids: List[str] = Field(default_factory=list, max_length=50)

class ResourceOutSchema(ResourceCreateSchema):
    id: str
    chunk_count: int
    file_url: Optional[str] = None
    created_at: str
    verification: str

class SearchRequest(BaseModel):
    query: str = Field(min_length=2, max_length=1200)
    region: Optional[str] = None
    resource_type: Optional[str] = None
    station: Optional[str] = None

class AskRequest(BaseModel):
    query: str = Field(min_length=2, max_length=1200)
    region: Optional[str] = None

class AskResponse(BaseModel):
    status: Literal["draft", "source_excerpts", "insufficient_evidence"]
    answer: str
    provider: Literal["gemini", "local-extractive", "local"]
    is_draft: bool
    evidence: List[Dict[str, Any]] = Field(default_factory=list)

class OutreachRequest(BaseModel):
    source_ids: List[str] = Field(min_length=1, max_length=5)
    audience: Literal["students", "general-public", "journalists", "educators"] = "students"
    format: Literal["public-summary", "website-article", "social-thread", "educational-explainer"] = "educational-explainer"
    length: Literal["short", "medium", "long"] = "medium"
    tone: Literal["inspiring", "fact-centric", "accessible", "formal"] = "accessible"
