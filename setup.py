import os
import subprocess
import sys
import venv
from pathlib import Path

# 프로젝트 루트 디렉토리
PROJECT_ROOT = Path(__file__).parent.absolute()
VENV_DIR = PROJECT_ROOT / "venv"
APP_DIR = PROJECT_ROOT / "python_menu_board"

# 필요한 패키지 목록
REQUIRED_PACKAGES = [
    "flask",
    "flask-sqlalchemy",
    "flask-login",
    "flask-migrate",
    "flask-wtf",
    "email-validator",
    "python-dotenv",
]

def create_venv():
    """가상환경 생성"""
    print("가상환경 생성 중...")
    venv.create(VENV_DIR, with_pip=True)
    
def get_venv_python():
    """가상환경의 Python 실행 경로 반환"""
    if sys.platform == "win32":
        return str(VENV_DIR / "Scripts" / "python.exe")
    return str(VENV_DIR / "bin" / "python")

def get_venv_pip():
    """가상환경의 pip 실행 경로 반환"""
    if sys.platform == "win32":
        return str(VENV_DIR / "Scripts" / "pip.exe")
    return str(VENV_DIR / "bin" / "pip")

def install_packages():
    """필요한 패키지 설치"""
    print("필요한 패키지 설치 중...")
    pip = get_venv_pip()
    subprocess.run([pip, "install", "--upgrade", "pip"])
    
    for package in REQUIRED_PACKAGES:
        print(f"설치 중: {package}")
        subprocess.run([pip, "install", package])

def run_app():
    """Flask 애플리케이션 실행"""
    print("Flask 애플리케이션 실행 중...")
    python = get_venv_python()
    
    # 현재 디렉토리를 APP_DIR로 변경
    os.chdir(APP_DIR)
    
    # Flask 애플리케이션 실행
    subprocess.run([python, "-m", "flask", "--app", "app.py", "--debug", "run"])

def main():
    """메인 실행 함수"""
    # 가상환경이 없으면 생성
    if not VENV_DIR.exists():
        create_venv()
        install_packages()
    
    # 애플리케이션 실행
    run_app()

if __name__ == "__main__":
    main() 