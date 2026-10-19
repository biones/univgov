#!/usr/bin/env python3
"""
UNIVGOV Official Alarm Audio Builder
Generates voice, SFX/BGM, and mastered MP3s for Univgov membership rewards.
"""
import os
import subprocess
import numpy as np
import scipy.io.wavfile as wav

AUDIO_DIR = "/Users/satoshi/work/univgov/site/assets/audio"
SR = 44100
os.makedirs(AUDIO_DIR, exist_ok=True)

def save_wav(filename, data):
    data = np.clip(data, -1.0, 1.0)
    wav.write(filename, SR, (data * 32767).astype(np.int16))

# 1. Voices Definition
TRACKS = [
    {
        "id": "track1_leader",
        "voice": "Grandpa",
        "rate": "175",
        "text": "起きよ！新任の宇宙市民よ、朝じゃ！地球の重力圏にしがみついて二度寝しておる場合ではないぞ！そなたの市民ウォレットには、すでに100万UNIの初期資金が着金しておるのじゃ！国家を運命の檻から選べる部品へと変える、偉大なる航海が始まるぞ。さあ目を開けて、ベッドから離脱するのじゃ！",
        "voice_delay_ms": 2200,
        "voice_vol": 1.4,
        "bgm_vol": 0.85,
        "voice_filter": "adelay=2200|2200,aecho=0.8:0.7:30|50:0.25|0.2",
        "out_mp3": "univgov_alarm_track1_leader.mp3",
        "duration": 28.0
    },
    {
        "id": "track2_ai",
        "voice": "Kyoko",
        "rate": "175",
        "text": "ピピピ。おはようございます、宇宙市民。起床予定時刻に到達しました。バイタルサイン確認。本日も重力のしがらみからエグジットし、自由なプロトコルへ接続してください。起床シークエンスを開始します。良き一日を。",
        "voice_delay_ms": 1400,
        "voice_vol": 1.5,
        "bgm_vol": 0.8,
        "voice_filter": "adelay=1400|1400,highpass=f=250,lowpass=f=3800,aecho=0.8:0.6:20|35:0.2|0.15",
        "out_mp3": "univgov_alarm_track2_ai.mp3",
        "duration": 21.0
    },
    {
        "id": "track3_alert",
        "voice": "Reed",
        "rate": "180",
        "text": "警報！警報！ベッドの引力が危険域に突入！このままでは地球の満員電車に捕獲されます！直ちにスヌーズを解除し、起床シークエンスを開始せよ！カウントダウン！スリー、ツー、ワン、離脱！",
        "voice_delay_ms": 1200,
        "voice_vol": 1.6,
        "bgm_vol": 0.8,
        "voice_filter": "adelay=1200|1200,highpass=f=350,lowpass=f=4200,acompressor=threshold=0.15:ratio=4:attack=5:release=50",
        "out_mp3": "univgov_alarm_track3_alert.mp3",
        "duration": 19.0
    },
    {
        "id": "track4_cafe",
        "voice": "Sandy",
        "rate": "170",
        "text": "おはようございます。ユニブゴブ・ステーションから、穏やかな朝をお知らせします。太陽風はおだやか、軌道はクリアです。今日もあなたのペースで、自由な一日をはじめましょう。いってらっしゃい。",
        "voice_delay_ms": 1800,
        "voice_vol": 1.4,
        "bgm_vol": 0.9,
        "voice_filter": "adelay=1800|1800,aecho=0.85:0.8:40|60:0.3|0.25",
        "out_mp3": "univgov_alarm_track4_cafe.mp3",
        "duration": 18.0
    }
]

# BGM synthesis functions
def generate_bgm_track1(duration):
    t = np.linspace(0, duration, int(SR * duration), False)
    audio = np.zeros_like(t)
    notes = [261.63, 329.63, 392.00, 493.88, 523.25]
    for i, freq in enumerate(notes):
        start_t = i * 0.4
        dur_note = 1.8
        mask = (t >= start_t) & (t < start_t + dur_note)
        t_sub = t[mask] - start_t
        env = np.exp(-3.0 * t_sub / dur_note) * np.sin(np.pi * np.clip(t_sub / 0.05, 0, 1) * 0.5)
        tone = 0.5 * np.sin(2 * np.pi * freq * t_sub) + 0.25 * np.sin(2 * np.pi * freq * 2 * t_sub) + 0.15 * np.sin(2 * np.pi * freq * 3 * t_sub)
        audio[mask] += 0.25 * tone * env
    shimmer_mask = (t >= 1.5) & (t < 4.0)
    t_shim = t[shimmer_mask] - 1.5
    audio[shimmer_mask] += 0.06 * np.sin(2 * np.pi * (1200 + 400 * np.sin(2 * np.pi * 8 * t_shim)) * t_shim) * np.exp(-1.5 * t_shim)
    pad_freqs = [65.4, 130.8, 196.0, 246.9, 293.7, 329.6]
    for f in pad_freqs:
        trem = 1.0 + 0.2 * np.sin(2 * np.pi * 0.2 * t + f)
        pad = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * (f * 1.002) * t)
        fade_in = np.clip(t / 3.0, 0, 1)
        fade_out = np.clip((duration - t) / 2.0, 0, 1)
        audio += 0.035 * pad * trem * fade_in * fade_out
    drone = np.sin(2 * np.pi * 55.0 * t) + 0.4 * np.sin(2 * np.pi * 110.0 * t)
    audio += 0.05 * drone * np.clip(t / 2.0, 0, 1) * np.clip((duration - t) / 2.0, 0, 1)
    outro_start = duration - 3.0
    for i, freq in enumerate([523.25, 659.25, 783.99, 1046.50]):
        st = outro_start + i * 0.2
        mask = (t >= st) & (t < st + 2.0)
        audio[mask] += 0.15 * np.sin(2 * np.pi * freq * (t[mask] - st)) * np.exp(-4.0 * (t[mask] - st))
    return audio

def generate_bgm_track2(duration):
    t = np.linspace(0, duration, int(SR * duration), False)
    audio = np.zeros_like(t)
    scan_mask = (t >= 0.1) & (t < 1.6)
    t_scan = t[scan_mask] - 0.1
    audio[scan_mask] += 0.12 * np.sin(2 * np.pi * (400.0 + 1200.0 * (t_scan / 1.5)**2) * t_scan) * (1.0 - t_scan / 1.5)
    audio += 0.15 * np.sin(2 * np.pi * 1760.0 * t) * np.exp(-40.0 * np.mod(t - 0.2, 0.12)) * ((t >= 0.2) & (t < 0.8))
    clock_env = np.exp(-35.0 * np.mod(t, 0.5))
    fade = np.clip(t / 1.5, 0, 1) * np.clip((duration - t) / 1.5, 0, 1)
    audio += 0.05 * np.sin(2 * np.pi * 1200.0 * t) * clock_env * fade
    bass_freq = np.where(np.mod(t, 4.0) < 2.0, 55.0, 73.416)
    bass = np.sign(np.sin(2 * np.pi * bass_freq * t)) * 0.3 + np.sin(2 * np.pi * bass_freq * t) * 0.7
    audio += 0.04 * bass * fade
    comp_mask = (t >= duration - 2.5) & (t < duration)
    t_comp = t[comp_mask] - (duration - 2.5)
    audio[comp_mask] += 0.15 * (np.sin(2 * np.pi * 880 * t_comp) * (t_comp < 0.2) + np.sin(2 * np.pi * 1760 * t_comp) * (t_comp >= 0.2)) * np.exp(-5.0 * t_comp)
    return audio

def generate_bgm_track3(duration):
    t = np.linspace(0, duration, int(SR * duration), False)
    audio = np.zeros_like(t)
    siren_mask = t < 5.0
    t_sir = t[siren_mask]
    audio[siren_mask] += 0.18 * np.sin(2 * np.pi * (700.0 + 350.0 * np.sin(2 * np.pi * 2.0 * t_sir)) * t_sir) * np.clip((5.0 - t_sir) / 1.0, 0, 1)
    interval = 60.0 / 140.0
    beat_t = np.mod(t, interval)
    kick = np.sin(2 * np.pi * (120.0 * np.exp(-30.0 * beat_t) + 45.0) * beat_t) * np.exp(-25.0 * beat_t)
    rng = np.random.default_rng(42)
    noise = rng.standard_normal(len(t))
    hihat = noise * np.exp(-70.0 * np.mod(t + interval/2, interval))
    fade = np.clip((t - 2.0) / 1.0, 0, 1) * np.clip((duration - t - 2.0) / 1.5, 0, 1)
    audio += 0.18 * kick * fade + 0.04 * hihat * fade
    for beep_t in [11.5, 12.5, 13.5]:
        b_mask = (t >= beep_t) & (t < beep_t + 0.15)
        audio[b_mask] += 0.22 * np.sin(2 * np.pi * 1000.0 * (t[b_mask] - beep_t)) * np.exp(-15.0 * (t[b_mask] - beep_t))
    warp_mask = t >= 14.2
    t_warp = t[warp_mask] - 14.2
    audio[warp_mask] += 0.25 * np.sin(2 * np.pi * (100.0 + 800.0 * np.exp(-1.5 * t_warp)) * t_warp) * np.exp(-0.8 * t_warp)
    return audio

def generate_bgm_track4(duration):
    t = np.linspace(0, duration, int(SR * duration), False)
    audio = np.zeros_like(t)
    for ct in [0.2, 4.0, 8.5, 13.0]:
        if ct < duration:
            c_mask = (t >= ct) & (t < ct + 4.5)
            t_c = t[c_mask] - ct
            bell = (np.sin(2 * np.pi * 528.0 * t_c) + 0.4 * np.sin(2 * np.pi * 528.0 * 2.76 * t_c)) * np.exp(-1.2 * t_c)
            audio[c_mask] += 0.15 * bell
    freqs = [174.6, 220.0, 261.6, 329.6, 392.0]
    for i, f in enumerate(freqs):
        lfo = 1.0 + 0.15 * np.sin(2 * np.pi * (0.1 + 0.05 * i) * t)
        fade = np.clip(t / 2.5, 0, 1) * np.clip((duration - t) / 2.0, 0, 1)
        audio += 0.03 * np.sin(2 * np.pi * f * t) * lfo * fade
    return audio

BGM_GENERATORS = [
    generate_bgm_track1,
    generate_bgm_track2,
    generate_bgm_track3,
    generate_bgm_track4
]

def main():
    print("=== UNIVGOV Alarm Audio Production Pipeline ===")
    for i, track in enumerate(TRACKS):
        print(f"[{i+1}/4] Processing {track['id']} ({track['voice']})...")
        
        # 1. TTS Voice
        raw_voice_aiff = os.path.join(AUDIO_DIR, f"{track['id']}_raw.aiff")
        subprocess.run(["say", "-v", track["voice"], "-r", track["rate"], track["text"], "-o", raw_voice_aiff], check=True)

        # 2. BGM
        bgm_wav = os.path.join(AUDIO_DIR, f"{track['id']}_bgm.wav")
        bgm_data = BGM_GENERATORS[i](track["duration"])
        save_wav(bgm_wav, bgm_data)

        # 3. Mixing
        out_mp3_path = os.path.join(AUDIO_DIR, track["out_mp3"])
        cmd = [
            "ffmpeg", "-y",
            "-i", bgm_wav,
            "-i", raw_voice_aiff,
            "-filter_complex",
            f"[1:a]{track['voice_filter']},volume={track['voice_vol']}[v];"
            f"[0:a]volume={track['bgm_vol']}[b];"
            f"[b][v]amix=inputs=2:duration=longest:dropout_transition=2[out]",
            "-map", "[out]",
            "-b:a", "192k",
            out_mp3_path
        ]
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        # Clean up intermediate raw files
        if os.path.exists(raw_voice_aiff):
            os.remove(raw_voice_aiff)
        if os.path.exists(bgm_wav):
            os.remove(bgm_wav)

        print(f"    -> Generated: {out_mp3_path}")

    print("=== All tracks built and cleaned up successfully! ===")

if __name__ == "__main__":
    main()
