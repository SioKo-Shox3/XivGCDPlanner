using System.Collections.Generic;
using XivGCDPlanner.Models;

namespace XivGCDPlanner.Services
{
    /// <summary>
    /// スキルデータを管理するサービス
    /// </summary>
    public class SkillDataService
    {
        /// <summary>
        /// サンプルのGCDスキルを取得
        /// </summary>
        /// <returns>GCDスキルのリスト</returns>
        public List<GcdSkill> GetSampleGcdSkills()
        {
            return new List<GcdSkill>
            {
                new GcdSkill
                {
                    Name = "ファイア",
                    SkillId = 141,
                    CastTime = 2.5,
                    Potency = 180,
                    BaseGcdTime = 2.5,
                    Description = "対象に火属性魔法攻撃。威力：180"
                },
                new GcdSkill
                {
                    Name = "ブリザド",
                    SkillId = 142,
                    CastTime = 2.5,
                    Potency = 180,
                    BaseGcdTime = 2.5,
                    Description = "対象に氷属性魔法攻撃。威力：180"
                },
                new GcdSkill
                {
                    Name = "サンダー",
                    SkillId = 144,
                    CastTime = 2.5,
                    Potency = 30,
                    BaseGcdTime = 2.5,
                    Description = "対象に雷属性魔法攻撃。威力：30 継続ダメージ：威力50 効果時間：30秒"
                },
                new GcdSkill
                {
                    Name = "ファイラ",
                    SkillId = 147,
                    CastTime = 3.0,
                    Potency = 260,
                    BaseGcdTime = 2.5,
                    Description = "対象に火属性魔法攻撃。威力：260"
                },
                new GcdSkill
                {
                    Name = "ブリザラ",
                    SkillId = 25793,
                    CastTime = 3.0,
                    Potency = 260,
                    BaseGcdTime = 2.5,
                    Description = "対象に氷属性魔法攻撃。威力：260"
                }
            };
        }

        /// <summary>
        /// サンプルのアビリティスキルを取得
        /// </summary>
        /// <returns>アビリティスキルのリスト</returns>
        public List<AbilitySkill> GetSampleAbilitySkills()
        {
            return new List<AbilitySkill>
            {
                new AbilitySkill
                {
                    Name = "ルーシッドドリーム",
                    SkillId = 7562,
                    CastTime = 0,
                    Potency = 0,
                    RecastTime = 60.0,
                    MaxCharges = 1,
                    Description = "自身のMPを継続回復する。回復力：550 効果時間：21秒"
                },
                new AbilitySkill
                {
                    Name = "迅速魔",
                    SkillId = 7561,
                    CastTime = 0,
                    Potency = 0,
                    RecastTime = 60.0,
                    MaxCharges = 1,
                    Description = "次に詠唱する魔法を即座に発動できる。効果時間：10秒"
                },
                new AbilitySkill
                {
                    Name = "三連魔",
                    SkillId = 7421,
                    CastTime = 0,
                    Potency = 0,
                    RecastTime = 60.0,
                    MaxCharges = 1,
                    Description = "3回まで魔法を即座に発動できる。効果時間：15秒"
                },
                new AbilitySkill
                {
                    Name = "マナフォント",
                    SkillId = 158,
                    CastTime = 0,
                    Potency = 0,
                    RecastTime = 100.0,
                    MaxCharges = 1,
                    Description = "自身のMPを全回復する。"
                }
            };
        }

        /// <summary>
        /// 指定された名前のGCDスキルを取得
        /// </summary>
        /// <param name="name">スキル名</param>
        /// <returns>見つかったスキル、見つからない場合null</returns>
        public GcdSkill? GetGcdSkillByName(string name)
        {
            var skills = GetSampleGcdSkills();
            return skills.Find(s => s.Name == name);
        }

        /// <summary>
        /// 指定された名前のアビリティスキルを取得
        /// </summary>
        /// <param name="name">スキル名</param>
        /// <returns>見つかったスキル、見つからない場合null</returns>
        public AbilitySkill? GetAbilitySkillByName(string name)
        {
            var skills = GetSampleAbilitySkills();
            return skills.Find(s => s.Name == name);
        }

        /// <summary>
        /// 指定されたIDのスキルを取得
        /// </summary>
        /// <param name="skillId">スキルID</param>
        /// <returns>見つかったスキル、見つからない場合null</returns>
        public SkillBase? GetSkillById(int skillId)
        {
            var gcdSkills = GetSampleGcdSkills();
            var gcdSkill = gcdSkills.Find(s => s.SkillId == skillId);
            if (gcdSkill != null)
                return gcdSkill;

            var abilitySkills = GetSampleAbilitySkills();
            return abilitySkills.Find(s => s.SkillId == skillId);
        }
    }
}
