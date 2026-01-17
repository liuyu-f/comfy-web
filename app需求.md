# 生图页设计

## 生图页架构(需要兼容手机页面，在手机上使用良好)

```ini
图片查看器模块: 查看/发送到图生图(当打开的是图生图区的图像时不显示)/翻页
流程模板编辑器模块: 文件名、JSON编辑器、参数状态（已支持参数常态显示在旁边，当编辑器里存在该参数时以绿色或其他颜色显示，当编辑器存在不支持的参数时，以红色额外显示）

界面结构
├─ 顶栏
│  ├─ .顶栏-左侧
│  │  ├─ .logo
│  │  ├─ 预设下拉            # 可以选择显示预设（保存comfyIP，流程，模型，vae...等所有参数）
│  │  │  ├─ 预设list框
│  │  │  └─ 保存、删除按钮   # 预设下拉框有选中的预设则直接保存，删除
│  └─ .顶栏-右侧
│     ├─ comfy IP输入 + status-dot
│     ├─ 流程下拉            # 可以显示选中的流程
│     │  ├─ 流程list框
│     │  └─ 编辑、删除按钮   # 流程下拉框有选中的流程则直接保存，删除，没有则新建
│     └─ 全局设置（popup-panel）
│        └─ 模型、VAE、Clip最后一层、CFG缩放
├─ 图像区                   # 可能
│  ├─ 图生图区              # 只有在json模板中存在"%image%"时才显示。点击生成时才正真将图片上传到comfy，并将返回的文件名替换"%image%"，最后才开始发送json生图。
│  │  ├─ btn-上传，清除上传图像
│  │  └─ 预览               # 点击由图片查看器查看
│  └─ 结果图像区            # 可能传回多张图像，
│     ├─ btn-保存(保存到服务器的output文件夹)，下载(下载到客户端)
│     ├─ 预览               # 点击由图片查看器查看
│     └─ 底部进度条
└─ 底栏
   ├─ .底栏-左侧
   │  └─ 参数设置（popup-panel）
   │     ├─ 提示词
   │     │  └─ 正向提示词，负面向提示词
   │     ├─ 画布
   │     │  └─ 初始宽高(仅文生图，图生图的分辨率自动调整)、缩放倍数("%scale%")、缩放算法("%upscale_method%")
   │     ├─ 采样器
   │     │  └─ 种子、步数、cfg、sampler、scheduler、denois
   │     └─ 采样器2
   │        └─ 种子_2、步数_2、cfg_2、sampler_2、scheduler_2、denois_2
   └─ .底栏-右侧
      └─ 生成按钮           # 当视口宽度不够时，生成按钮自动另起一行
```

1.当点击参数的标题时，能够显示参数的模板指代，如:"%seed%"
2.其他需要独立的模块都可以独立出来，方便编辑和定位问题。
由于页面需要在手机上也要体验良好，所以我想了一个充分利用弹出机制的架构，这个架构只是我幼稚的想法，你可以大方的修整或重新设计。

## 参数参考

这些是可用于构建动态UI的参数。在工作流模板中，可以使用 `%参数名%` 的形式作为占位符。

| 分组 (Group)          | 参数名 (Parameter) | UI 类型建议     | 数据类型  | 约束与默认值                  | 描述                                                        |
| :-------------------- | :----------------- | :-------------- | :-------- | :---------------------------- | :---------------------------------------------------------- |
| **模型设置**          | `model`            | 下拉选择        | `string`  |                               | 主模型，值列表从 ComfyUI API 获取                           |
|                       | `vae`              | 下拉选择        | `string`  |                               | VAE 模型，值列表从 ComfyUI API 获取                         |
|                       | `clip_last_layer`  | 数字输入        | `integer` | 默认: -2, 范围: [-24, -1]     | CLIP 模型使用的倒数层数                                     |
|                       | `rescale_cfg`      | 滑块            | `float`   | 默认: 0.7, 范围: [0.0, 1.0]   | CFG 缩放，用于调整图像饱和度                                |
| **提示词**            | `prompt`           | 多行文本框      | `string`  |                               | 正向提示词                                                  |
|                       | `negative_prompt`  | 多行文本框      | `string`  |                               | 负向提示词                                                  |
| **尺寸与缩放**        | `width`            | 数字输入        | `integer` | 默认: 512, 范围: [16, 16384]  | 图像宽度                                                    |
|                       | `height`           | 数字输入        | `integer` | 默认: 768, 范围: [16, 16384]  | 图像高度                                                    |
|                       | `upscale_method`   | 下拉选择        | `string`  |                               | 放大算法，值列表从 ComfyUI API 获取                         |
|                       | `scale`            | 滑块            | `float`   | 默认: 2.0, 范围: [0.01, 5.0]  | 放大倍数                                                    |
| **生成参数 (Pass 1)** | `seed`             | 选择框+数字输入 | `integer` |                               | 种子，选择框选中则在生图时生成随机数并显示在输入框          |
|                       | `steps`            | 数字输入        | `integer` | 默认: 25, 范围: [1, 10000]    | 迭代步数                                                    |
|                       | `cfg`              | 数字输入        | `float`   | 默认: 7.0, 范围: [1.0, 100.0] | 提示词相关性强度                                            |
|                       | `sampler`          | 下拉选择        | `string`  |                               | 采样器，值列表从 ComfyUI API 获取                           |
|                       | `scheduler`        | 下拉选择        | `string`  |                               | 调度器，值列表从 ComfyUI API 获取                           |
|                       | `denoise`          | 滑块            | `float`   | 默认: 1.0, 范围: [0.0, 1.0]   | 降噪强度 (img2img 或 Pass 2 中常用)                         |
| **生成参数 (Pass 2)** | `seed_2`           | 选择框+数字输入 | `integer` |                               | (第二个) 种子，选择框选中则在生图时生成随机数并显示在输入框 |
|                       | `steps_2`          | 数字输入        | `integer` | 默认: 25, 范围: [1, 10000]    | (第二个) 迭代步数                                           |
|                       | `cfg_2`            | 数字输入        | `float`   | 默认: 7.0, 范围: [1.0, 100.0] | (第二个) 提示词相关性                                       |
|                       | `sampler_2`        | 下拉选择        | `string`  |                               | (第二个) 采样器                                             |
|                       | `scheduler_2`      | 下拉选择        | `string`  |                               | (第二个) 调度器                                             |
|                       | `denoise_2`        | 滑块            | `float`   | 默认: 0.55, 范围: [0.0, 1.0]  | (第二个) 降噪强度                                           |

## 生图流程的 工作流模板 与 最终工作流示例

工作流模板:（注意工作流不要写死在代码里，让用户自己编辑或上传）

```json 工作流模板
{
  "50": {
    "inputs": {
      "seed": "%seed_2%",
      "steps": "%steps_2%",
      "cfg": "%cfg_2%",
      "sampler_name": "%sampler_2%",
      "scheduler": "%scheduler_2%",
      "denoise": "%denoise_2%",
      "model": ["105", 0],
      "positive": ["62", 0],
      "negative": ["102", 0],
      "latent_image": ["106", 0]
    },
    "class_type": "KSampler",
    "_meta": {
      "title": "K采样器-后采样"
    }
  },
  "52": {
    "inputs": {
      "samples": ["50", 0],
      "vae": ["67", 0]
    },
    "class_type": "VAEDecode",
    "_meta": {
      "title": "VAE解码"
    }
  },
  "61": {
    "inputs": {
      "samples": ["69", 0],
      "vae": ["67", 0]
    },
    "class_type": "VAEDecode",
    "_meta": {
      "title": "VAE解码"
    }
  },
  "62": {
    "inputs": {
      "conditioning_to": ["63", 0],
      "conditioning_from": ["68", 0]
    },
    "class_type": "ConditioningConcat",
    "_meta": {
      "title": "条件连接-正向"
    }
  },
  "63": {
    "inputs": {
      "text": "(masterpiece, best quality:1.05), exquisite detail, CG",
      "clip": ["104", 0]
    },
    "class_type": "CLIPTextEncode",
    "_meta": {
      "title": "CLIP文本编码-正向基础"
    }
  },
  "64": {
    "inputs": {
      "text": "nsfw, (normal quality, worst quality, low quality, lowres), error, censored, bar censor, text, watermark, speech bubble, artist name, signature, border, sketch, bad anatomy, bad hands, missing fingers, extra digit, fewer digits",
      "clip": ["104", 0]
    },
    "class_type": "CLIPTextEncode",
    "_meta": {
      "title": "CLIP文本编码-负向基础"
    }
  },
  "65": {
    "inputs": {
      "width": "%width%",
      "height": "%height%",
      "batch_size": 1
    },
    "class_type": "EmptyLatentImage",
    "_meta": {
      "title": "空Latent图像-文生图"
    }
  },
  "67": {
    "inputs": {
      "vae_name": "%vae%"
    },
    "class_type": "VAELoader",
    "_meta": {
      "title": "加载VAE"
    }
  },
  "68": {
    "inputs": {
      "text": "%prompt%",
      "clip": ["104", 0]
    },
    "class_type": "CLIPTextEncode",
    "_meta": {
      "title": "CLIP文本编码-正向"
    }
  },
  "69": {
    "inputs": {
      "seed": "%seed%",
      "steps": "%steps%",
      "cfg": "%cfg%",
      "sampler_name": "%sampler%",
      "scheduler": "%scheduler%",
      "denoise": "%denoise%",
      "model": ["105", 0],
      "positive": ["62", 0],
      "negative": ["102", 0],
      "latent_image": ["65", 0]
    },
    "class_type": "KSampler",
    "_meta": {
      "title": "K采样器-初始"
    }
  },
  "70": {
    "inputs": {
      "ckpt_name": "%model%"
    },
    "class_type": "CheckpointLoaderSimple",
    "_meta": {
      "title": "Checkpoint加载器（简易）"
    }
  },
  "101": {
    "inputs": {
      "text": "%negative_prompt%",
      "clip": ["104", 0]
    },
    "class_type": "CLIPTextEncode",
    "_meta": {
      "title": "CLIP文本编码-负向"
    }
  },
  "102": {
    "inputs": {
      "conditioning_to": ["64", 0],
      "conditioning_from": ["101", 0]
    },
    "class_type": "ConditioningConcat",
    "_meta": {
      "title": "条件连接-负向"
    }
  },
  "104": {
    "inputs": {
      "stop_at_clip_layer": "clip_last_layer",
      "clip": ["70", 1]
    },
    "class_type": "CLIPSetLastLayer",
    "_meta": {
      "title": "设置CLIP最后一层"
    }
  },
  "105": {
    "inputs": {
      "multiplier": "%rescale_cfg%",
      "model": ["70", 0]
    },
    "class_type": "RescaleCFG",
    "_meta": {
      "title": "缩放CFG"
    }
  },
  "106": {
    "inputs": {
      "upscale_method": "%upscale_method%",
      "scale_by": "%scale%",
      "samples": ["69", 0]
    },
    "class_type": "LatentUpscaleBy",
    "_meta": {
      "title": "缩放Latent（比例）"
    }
  },
  "125": {
    "inputs": {
      "images": ["61", 0]
    },
    "class_type": "PreviewImage",
    "_meta": {
      "title": "预览图像-初始"
    }
  },
  "126": {
    "inputs": {
      "images": ["52", 0]
    },
    "class_type": "PreviewImage",
    "_meta": {
      "title": "预览图像-后采样"
    }
  }
}
```

---

最终发送工作流示例:

```json 最终工作流示例
{
  "3": {
    "inputs": {
      "seed": 156680208700286,
      "steps": 20,
      "cfg": 8,
      "sampler_name": "euler",
      "scheduler": "normal",
      "denoise": 1,
      "model": ["4", 0],
      "positive": ["6", 0],
      "negative": ["7", 0],
      "latent_image": ["5", 0]
    },
    "class_type": "KSampler",
    "_meta": {
      "title": "K采样器"
    }
  },
  "4": {
    "inputs": {
      "ckpt_name": "三次元_AstrAnime\\astranime_V6.safetensors"
    },
    "class_type": "CheckpointLoaderSimple",
    "_meta": {
      "title": "Checkpoint加载器（简易）"
    }
  },
  "5": {
    "inputs": {
      "width": 512,
      "height": 512,
      "batch_size": 1
    },
    "class_type": "EmptyLatentImage",
    "_meta": {
      "title": "空Latent图像"
    }
  },
  "6": {
    "inputs": {
      "text": "beautiful scenery nature glass bottle landscape, , purple galaxy bottle,",
      "clip": ["4", 1]
    },
    "class_type": "CLIPTextEncode",
    "_meta": {
      "title": "CLIP文本编码"
    }
  },
  "7": {
    "inputs": {
      "text": "text, watermark",
      "clip": ["4", 1]
    },
    "class_type": "CLIPTextEncode",
    "_meta": {
      "title": "CLIP文本编码"
    }
  },
  "8": {
    "inputs": {
      "samples": ["3", 0],
      "vae": ["4", 2]
    },
    "class_type": "VAEDecode",
    "_meta": {
      "title": "VAE解码"
    }
  },
  "9": {
    "inputs": {
      "filename_prefix": "ComfyUI",
      "images": ["8", 0]
    },
    "class_type": "SaveImage",
    "_meta": {
      "title": "保存图像"
    }
  }
}
```
