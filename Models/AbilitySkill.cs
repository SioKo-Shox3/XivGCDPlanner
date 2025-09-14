using System;

namespace XivGCDPlanner.Models
{
    /// <summary>
    /// アビリティスキル
    /// 個別のリキャスト時間を持つ
    /// </summary>
    public class AbilitySkill : SkillBase
    {
        /// <summary>
        /// リキャスト時間（秒）
        /// </summary>
        public double RecastTime { get; set; }

        /// <summary>
        /// 最大チャージ数（複数回使用可能なスキル用）
        /// </summary>
        public int MaxCharges { get; set; } = 1;

        /// <summary>
        /// 現在のチャージ数
        /// </summary>
        public int CurrentCharges { get; private set; }

        /// <summary>
        /// 最後に使用した時刻
        /// </summary>
        public double LastUseTime { get; private set; } = -1;

        /// <summary>
        /// 次のチャージが回復する時刻
        /// </summary>
        public double NextChargeTime => LastUseTime < 0 ? 0 : LastUseTime + RecastTime;

        /// <summary>
        /// コンストラクタ
        /// </summary>
        public AbilitySkill()
        {
            CurrentCharges = MaxCharges;
        }

        /// <summary>
        /// 現在時刻でアビリティが使用可能かどうか
        /// </summary>
        /// <param name="currentTime">現在時刻</param>
        /// <returns>使用可能な場合true</returns>
        public override bool CanUse(double currentTime)
        {
            UpdateCharges(currentTime);
            return CurrentCharges > 0;
        }

        /// <summary>
        /// アビリティを使用
        /// </summary>
        /// <param name="useTime">使用時刻</param>
        public override void Use(double useTime)
        {
            UpdateCharges(useTime);
            
            if (CurrentCharges <= 0)
            {
                throw new InvalidOperationException($"アビリティ '{Name}' は時刻 {useTime:F2} では使用できません。次回チャージ時刻: {NextChargeTime:F2}");
            }

            CurrentCharges--;
            LastUseTime = useTime;
        }

        /// <summary>
        /// チャージ数を現在時刻に基づいて更新
        /// </summary>
        /// <param name="currentTime">現在時刻</param>
        private void UpdateCharges(double currentTime)
        {
            if (LastUseTime < 0 || CurrentCharges >= MaxCharges)
                return;

            double timeSinceLastUse = currentTime - LastUseTime;
            int chargesRecovered = (int)(timeSinceLastUse / RecastTime);
            
            CurrentCharges = Math.Min(MaxCharges, CurrentCharges + chargesRecovered);
            
            // 最後の使用時刻を調整（部分的なリキャスト時間を考慮）
            if (chargesRecovered > 0)
            {
                LastUseTime += chargesRecovered * RecastTime;
            }
        }

        /// <summary>
        /// リキャストの残り時間を取得
        /// </summary>
        /// <param name="currentTime">現在時刻</param>
        /// <returns>残り時間（秒）</returns>
        public double GetRemainingRecastTime(double currentTime)
        {
            UpdateCharges(currentTime);
            
            if (CurrentCharges >= MaxCharges)
                return 0;

            double remaining = NextChargeTime - currentTime;
            return Math.Max(0, remaining);
        }

        /// <summary>
        /// チャージの状態を文字列で取得
        /// </summary>
        /// <param name="currentTime">現在時刻</param>
        /// <returns>チャージ状態の文字列</returns>
        public string GetChargeStatus(double currentTime)
        {
            UpdateCharges(currentTime);
            return $"{CurrentCharges}/{MaxCharges}";
        }
    }
}
